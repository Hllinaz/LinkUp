// server.js
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import neo4j, { graph } from 'neo4j-driver';
import bcrypt from 'bcrypt';

const app = express();
app.use(cors());
app.use(express.json());

// ===== Neo4j driver =====
const driver = neo4j.driver(
  process.env.NEO4J_URI, // ej: bolt://localhost:7687
  neo4j.auth.basic(process.env.NEO4J_USER, process.env.NEO4J_PASSWORD) // ¡OJO!: PASSWORD= en .env
);

// ===== Helpers =====
function sign(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

function auth(req, _res, next) {
  const header = req.headers.authorization || '';
  const token = header.replace('Bearer ', '');
  if (!token) return next();
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
  } catch { }
  next();
}

// ===== Hash helper =====
const saltRounds = 12;

async function hashPassword(password) {
  return await bcrypt.hash(password, saltRounds);
}

async function comparePassword(password, hash) {
  return await bcrypt.compare(password, hash);
}


function asInt(n) {
  return typeof n?.toInt === 'function' ? n.toInt() : n;
}

// ===== Salud =====
app.get('/health', (_req, res) =>
  res.json({ ok: true, service: 'LinkUp API', time: new Date().toISOString() })
);

// ===== Auth =====
app.post('/auth/register', async (req, res) => {
  const session = driver.session();
  try {
    const { username, name, email, password } = req.body;

    if (!name || !username || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const existingUser = await session.run(
      `MATCH (u:User) 
       WHERE u.username = $username OR u.email = $email 
       RETURN u LIMIT 1`,
      { username, email }
    );

    if (existingUser.records.length > 0) {
      return res.status(400).json({ message: 'Username or email already exists' });
    }

    const hashedPassword = await hashPassword(password);

    const result = await session.run(
      `CREATE (u:User {
        name: $name,
        username: $username,
        email: $email,
        password: $hashedPassword,
        createdAt: datetime()
      }) RETURN u`,
      { name, username, email, hashedPassword }
    );

    const user = result.records[0].get('u').properties;
    const token = sign(user.username);

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email
      }
    });

  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  } finally {
    await session.close();
  }
});

// LOGIN - El servidor compara el hash
app.post('/auth/login', async (req, res) => {
  const session = driver.session();
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    // Buscar usuario
    const result = await session.run(
      `MATCH (u:User { username: $username }) 
       RETURN u`,
      { username }
    );

    if (result.records.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = result.records[0].get('u').properties;

    // Comparar contraseñas (bcrypt lo hace seguro)
    const isValidPassword = await comparePassword(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = sign(user.username);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  } finally {
    await session.close();
  }
});

app.get('/me/:otherUser', auth, async (req, res) => {
  if (!req.userId)
    return res.status(401).json({ error: 'No autenticado' });
  const { otherUser } = req.params;
  const session = driver.session();
  try {
    const r = await session.run(`
      MATCH(user:User {username: $me})
      RETURN user.username = $otherUser as isMe`,
      { me: req.userId, otherUser: otherUser }
    );
    res.json(r.records[0].get('isMe'))
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
  finally { await session.close(); }
});

app.get('/me', auth, async (req, res) => {
  if (!req.userId)
    return res.status(401).json({ error: 'No autenticado' });
  const session = driver.session();
  try {
    const r = await session.run(`
      MATCH (u:User {username:$me})
      OPTIONAL MATCH (u)-[:INTEREST_IN]->(i:Interest)
      WITH u, collect(i.name) AS interests
      OPTIONAL MATCH (u)-[:FOLLOWS]->(otherUser:User)
      WHERE u <> otherUser and (otherUser)-[:FOLLOWS]->(u)
      WITH u, interests, count(otherUser) as friends
      OPTIONAL MATCH (u)-[:HAS_POST]->(post:Post)
      WITH u, interests, friends, count(post) as posts
      RETURN u{.*, username:u.username, interests:interests, friends:friends, posts:posts} AS me`,
      { me: req.userId }
    );
    res.json(r.records[0].get('me'));
  } catch (e) { res.status(400).json({ error: e.message }); }
  finally { await session.close(); }
});

app.put('/me', auth, async (req, res) => {
  if (!req.userId)
    return res.status(401).json({ error: 'No autenticado' });
  const { name, username, email, password } = req.body;
  const session = driver.session();
  try {
    const hashedPassword = await hashPassword(password);

    const r = await session.run(`
      MATCH (user:User {username:$me})
      SET 
      user.name = coalesce($name, user.name), 
      user.username = coalesce($username, user.username),
      user.email = coalesce($email, user.email), 
      user.password = coalesce($password, user.password)
      RETURN user as updatedUser`,
      { me: req.userId, username, name, password: hashedPassword, email }
    );
    const token = sign(username);
    res.json({ ok: true, token: token });
  } catch (e) { res.status(400).json({ error: e.message }); }
  finally { await session.close(); }
});

app.get('/me/interests', auth, async (req, res) => {
  if (!req.userId)
    return res.status(401).json({ error: 'No autenticado' });
  const session = driver.session();
  try {
    const r = await session.run(
      `
      MATCH (i:Interest)
      WHERE not (:User {username:$me})-[:INTEREST_IN]-(i)
      RETURN collect(i{.*}) as interest`,
      { me: req.userId }
    );
    const rec = r.records[0]
    res.json(rec.get('interest'));
  } catch (e) { res.status(400).json({ error: e.message }); }
  finally { await session.close(); }
});

app.get('/me/interests', auth, async (req, res) => {
  if (!req.userId)
    return res.status(401).json({ error: 'No autenticado' });
  const session = driver.session();
  try {
    const r = await session.run(`
      MATCH (i:Interest)
      WHERE not (:User {username:$me})-[:INTEREST_IN]-(i)
      RETURN collect(i{.*}) as interest`,
      { me: req.userId }
    );
    const rec = r.records[0]
    res.json(rec.get('interest'));
  } catch (e) { res.status(400).json({ error: e.message }); }
  finally { await session.close(); }
});

// ===== Seguir / Dejar de seguir =====
app.get('/follow/:username', auth, async (req, res) => {
  if (!req.userId)
    return res.status(401).json({ error: 'No autenticado' });
  const { username } = req.params;
  const session = driver.session();
  try {
    const r = await session.run(`
      MATCH (me:User {username: $username}), (user:User {username: $otherUsername})
      RETURN EXISTS((me)-[:FOLLOWS]->(user)) AS isFollowing
      `,
      { username: req.userId, otherUsername: username }
    );
    res.json(r.records[0].get('isFollowing'));
  } catch (e) { res.status(400).json({ error: e.message }); }
  finally { await session.close(); }
});

app.post('/follow/:username', auth, async (req, res) => {
  if (!req.userId)
    return res.status(401).json({ error: 'No autenticado' });
  const { username } = req.params;
  const session = driver.session();
  try {
    await session.run(
      `MATCH (me:User {username:$me}), (u:User {username:$u})
       MERGE (me)-[:FOLLOWS]->(u)`,
      { me: req.userId, u: username }
    );
    res.json({ ok: true });
  } catch (e) { res.status(400).json({ error: e.message }); }
  finally { await session.close(); }
});

app.delete('/follow/:username', auth, async (req, res) => {
  if (!req)
    return res.status(401).json({ error: 'No autenticado' });
  const { username } = req.params;
  const session = driver.session();
  try {
    await session.run(
      `MATCH (me:User {username:$me})-[r:FOLLOWS]->(u:User {username:$u})
       DELETE r`,
      { me: req.userId, u: username }
    );
    res.json({ ok: true });
  } catch (e) { res.status(400).json({ error: e.message }); }
  finally { await session.close(); }
});

// ===== Intereses (My Profile / Settings) =====
app.put('/me/interests', auth, async (req, res) => {
  if (!req.userId)
    return res.status(401).json({ error: 'No autenticado' });
  const { interests = [] } = req.body; // ["music","tech"]
  const session = driver.session();
  try {
    await session.run(
      `MATCH (u:User {username:$me})
       OPTIONAL MATCH (u)-[r:INTEREST_IN]->(:Interest) DELETE r`,
      { me: req.userId }
    );
    if (interests.length) {
      await session.run(
        `UNWIND $ints AS n
         MATCH (u:User {username:$me})
         MERGE (i:Interest {name:trim(toLower(n))})
         MERGE (u)-[:INTEREST_IN]->(i)`,
        { me: req.userId, ints: interests }
      );
    }
    res.json({ ok: true });
  } catch (e) { res.status(400).json({ error: e.message }); }
  finally { await session.close(); }
});

// ===== Posts =====
app.get('/posts', auth, async (req, res) => {
  if (!req.userId)
    return res.status(401).json({ error: 'No autenticado' });
  const session = driver.session();
  try {
    const r = await session.run(`
      MATCH (me:User {username:$username})

      CALL (me) {
        MATCH (author:User)-[:HAS_POST]->(post:Post)
        WHERE author = me
        OPTIONAL MATCH (post)-[:ON_POST]-(c:Comment)
        RETURN  post as suggestedPost, author as postAuthor, {isOwner: true} as Own, count(c) as comments
        UNION
        MATCH (author:User)-[:HAS_POST]->(post:Post)
        WHERE  author <> me AND (me)-[:FOLLOWS]->(author)
        OPTIONAL MATCH (post)-[:ON_POST]-(c:Comment)
        RETURN post as suggestedPost, author as postAuthor, {isOwner: false} as Own, count(c) as comments
        UNION
        MATCH (me)-[:FOLLOWS]->(friend:User)-[:HAS_POST]->(post:Post)
        WHERE friend <> me AND exists { (:Comment)-[:ON_POST]->(post) }
        OPTIONAL MATCH (post)-[:ON_POST]-(c:Comment)
        RETURN post AS suggestedPost, friend AS postAuthor, {isOwner: false} as Own, count(c) as comments
        UNION
        MATCH (me)-[:INTEREST_IN]->(i:Interest)<-[:INTEREST_IN]-(otherAuthor:User)-[:HAS_POST]->(post:Post)
        WHERE otherAuthor <> me AND NOT (me)-[:FOLLOWS]->(otherAuthor)
        OPTIONAL MATCH (post)-[:ON_POST]-(c:Comment)
        RETURN post AS suggestedPost, otherAuthor as postAuthor, {isOwner: false} as Own, count(c) as comments
      }

      WITH distinct suggestedPost, postAuthor, Own, comments
      MATCH (postAuthor:User)-[:HAS_POST]->(suggestedPost)
      RETURN collect({
      author: postAuthor{.*, username:postAuthor.username},
      post: suggestedPost{.*, id:suggestedPost.id},
      comments: comments,
      isOwner: Own.isOwner }) AS suggested
      `,
      { username: req.userId }
    );
    const suggestedFeed = r.records[0].get('suggested');
    res.json(suggestedFeed);
  } catch (e) {
    res.status(400).json({ error: e.message });
  } finally { await session.close(); }
});

app.post('/posts', auth, async (req, res) => {
  if (!req.userId)
    return res.status(401).json({ error: 'No autenticado' });
  const { text, imageUrl } = req.body;
  const session = driver.session();
  try {
    const r = await session.run(
      `
      MATCH (u:User {username:$username})
      CREATE (u)-[:HAS_POST]->(p:Post {
        id: randomUUID(), text:$text, imageUrl:$imageUrl, createdAt: datetime()
      })
      RETURN u{.*, username:u.username} AS author, p{.*, id:p.id} AS post
      `,
      { username: req.userId, text, imageUrl }
    );
    const rec = r.records[0];
    res.json({ author: rec.get('author'), post: rec.get('post'), comments: 0 });
  } catch (e) { res.status(400).json({ error: e.message }); }
  finally { await session.close(); }
});

app.get('/posts/:id', auth, async (req, res) => {
  if (!req.userId)
    return res.status(401).json({ error: 'No autenticado' });
  const { id } = req.params;
  const session = driver.session();
  try {
    const r = await session.run(`
      MATCH (p:Post {id:$id})<-[:HAS_POST]-(u:User)
      WITH p, u
      OPTIONAL MATCH (c:Comment)-[:ON_POST]->(p)
      WITH u, p, count(c) as comment
      return u{
      username:u.username, 
      name:u.name, 
      isMe: u.username = $me} AS author, 
      p{.*, id:p.id, comment:comment} AS post
      `,
      { me: req.userId, id }
    );
    const rec = r.records[0];
    res.json({ author: rec.get('author'), post: rec.get('post') });
  } catch (e) { res.status(400).json({ error: e.message }); }
  finally { await session.close(); }
});

app.delete('/posts/:id', auth, async (req, res) => {
  if (!req.userId)
    return res.status(401).json({ error: 'No autenticado' });
  const { id } = req.params;
  const session = driver.session();
  try {
    await session.run(
      `
      MATCH (u:User {username:$me})-[:HAS_POST]->(p:Post {id:$id})
      OPTIONAL MATCH (p)<-[:ON_POST]-(c:Comment)
      DETACH DELETE c, p
      `,
      { me: req.userId, id }
    );
    res.json({ ok: true });
  } catch (e) { res.status(400).json({ error: e.message }); }
  finally { await session.close(); }
});

// Comentarios mínimos (para “si borra el post, vuelan comentarios” ya está resuelto)
app.post('/posts/:id/comments', auth, async (req, res) => {
  if (!req.userId)
    return res.status(401).json({ error: 'No autenticado' });
  const { id } = req.params;
  const { text } = req.body;
  const session = driver.session();
  try {
    const r = await session.run(
      `MATCH (u:User {username:$me}), (p:Post {id:$id})
       CREATE (u)-[:ON_POST]->(c:Comment {id:randomUUID(), text:$text, createdAt: datetime()})-[:ON_POST]->(p)
       RETURN c`,
      { me: req.userId, id, text }
    );
    res.json({ ok: true });
  } catch (e) { res.status(400).json({ error: e.message }); }
  finally { await session.close(); }
});

app.get('/posts/:id/comments', auth, async (req, res) => {
  if (!req.userId)
    return res.status(401).json({ error: 'No autenticado' });
  const { id } = req.params;
  const session = driver.session();
  try {
    const r = await session.run(`
      MATCH (p:Post {id:$id})<-[:ON_POST]-(c:Comment)<-[:ON_POST]-(u:User)
      RETURN collect({ comment:c{.*}, author:u{name:u.name, username:u.username, isMe: u.username = $me}}) as comments`,
      { me: req.userId, id }
    );
    const rec = r.records[0].get('comments')
    res.json(rec);
  } catch (e) { res.status(400).json({ error: e.message }); }
  finally { await session.close(); }
});

// ===== Recomendaciones / Explore =====
app.get('/recommendations/users', auth, async (req, res) => {
  if (!req.userId)
    return res.status(401).json({ error: 'No autenticado' });
  const me = req.userId;
  const session = driver.session();
  try {
    const r = await session.run(
      `
      MATCH (me:User {username:$me})
      MATCH (u:User)
      WHERE u <> me AND NOT (me)-[:FOLLOWS]->(u)
      OPTIONAL MATCH (me)-[:INTEREST_IN]->(i:Interest)<-[:INTEREST_IN]-(u)
      WITH u, count(i) AS sharedInterests
      OPTIONAL MATCH (me)-[:FOLLOWS]->(:User)-[:FOLLOWS]->(u)
      WITH u, sharedInterests, count(*) AS mutuals
      RETURN u{.*, username:u.username, sharedInterests:sharedInterests, mutuals:mutuals}
      ORDER BY sharedInterests DESC, mutuals DESC, u.createdAt DESC
      LIMIT 10
      `,
      { me }
    );
    res.json(r.records.map(x => x.get(0)));
  } catch (e) { res.status(400).json({ error: e.message }); }
  finally { await session.close(); }
});

// “Comunidades”: por simplicidad las agrupamos por interés (nombre y tamaño)
app.get('/explore/communities', async (_req, res) => {
  const session = driver.session();
  try {
    const r = await session.run(
      `
      MATCH (i:Interest)<-[:INTEREST_IN]-(u:User)
      RETURN i.name AS name, count(u) AS members
      ORDER BY members DESC, name ASC
      LIMIT 20
      `
    );
    res.json(r.records.map(rec => ({
      name: rec.get('name'),
      members: asInt(rec.get('members'))
    })));
  } catch (e) { res.status(400).json({ error: e.message }); }
  finally { await session.close(); }
});

// ===== Perfil de usuario (intereses) =====
app.get('/users/:username', async (req, res) => {
  const { username } = req.params;
  const session = driver.session();
  try {
    const r = await session.run(
      `
      MATCH (u:User {username:$username})

      OPTIONAL MATCH (u)-[:INTEREST_IN]->(i:Interest)
      WITH u, collect(i.name) AS interests

      CALL (u) {
        MATCH (u:User)-[:HAS_POST]->(p:Post)
        OPTIONAL MATCH (p)-[:ON_POST]-(c:Comment)
        WITH p, count(c) as comments
        RETURN collect(p{.*, id:p.id, comments: comments}) as posts
      }

      WITH DISTINCT u, interests, posts
      RETURN {
        username: u.username,
        name: u.name,
        interests: interests,
        posts: posts } AS profile
      `,
      { username }
    );
    if (!r.records.length) return res.status(404).json({ error: 'Usuario no existe' });
    res.json(r.records[0].get('profile'));
  } catch (e) { res.status(400).json({ error: e.message }); }
  finally { await session.close(); }
});

// ===== Analytics (top por número de seguidores) =====
app.get('/analytics/top-users', async (_req, res) => {
  const session = driver.session();
  try {
    const r = await session.run(
      `
      MATCH (u:User)
      OPTIONAL MATCH (u)<-[:FOLLOWS]-(:User)
      WITH u, count(*) AS followers
      RETURN u{.*, username:u.username, followers: followers}
      ORDER BY followers DESC, u.createdAt DESC
      LIMIT 20
      `
    );
    res.json(r.records.map(rec => {
      const o = rec.get(0);
      o.followers = asInt(o.followers);
      return o;
    }));
  } catch (e) { res.status(400).json({ error: e.message }); }
  finally { await session.close(); }
});

// ===== Grafo de usuario (datos para dibujar) =====
app.get('/graph/:username', async (req, res) => {
  const { username } = req.params;
  const session = driver.session();
  try {
    const r = await session.run(`
    MATCH (me:User {username: $userId})
    // Usuarios que sigo
    OPTIONAL MATCH (me)-[:FOLLOWS]->(f:User)
    WITH me, collect(DISTINCT f) AS following

    // Usuarios que me siguen
    OPTIONAL MATCH (u:User)-[:FOLLOWS]->(me)
    WITH me, following, collect(DISTINCT u) AS followers

    // Unir ambos conjuntos
    WITH me, following, followers, following + followers AS both
    UNWIND both AS n
    WITH me, following, followers, collect(DISTINCT n) AS neigh

    // Construir nodos con propiedades
    WITH me, following, followers, neigh,
         [n IN neigh | {
            id: n.id,
            label: coalesce(n.name, n.username, n.email, n.id),
            i_follow: n IN following,
            follows_me: n IN followers,
            mutual: (n IN following) AND (n IN followers)
         }] AS nodes

    // Construir relaciones
    WITH me, nodes,
         [n IN nodes WHERE n.i_follow   | {source: me.id, target: n.id, type: 'FOLLOWS'}] +
         [n IN nodes WHERE n.follows_me | {source: n.id, target: me.id, type: 'FOLLOWS'}] AS links

    RETURN {
      nodes: [{id: me.id, label: coalesce(me.name, me.username, me.email, me.id), isMe: true}] + nodes,
      links: links
    } AS graph`,
      { userId: username }
    );
    console.log(r)
    if (r.length === 0) {
      res.json({ nodes: [], links: [] });
    }
    const result = r.records[0]
    res.json({graph: result});
  } catch (e) { res.status(400).json({ error: e.message }); }
  finally { await session.close(); }
});

// ===== Raíz =====
app.get('/', (_req, res) => {
  res.send('API OK. Usa /health para status.');
});

// ===== Start =====
app.listen(process.env.PORT || 4000, () => {
  console.log(`API running on http://localhost:${process.env.PORT || 4000}`);
});
