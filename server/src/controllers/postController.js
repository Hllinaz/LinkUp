import driver from '../config/database.js';

export const getPosts = async (req, res) => {
  if (!req.userId) return res.status(401).json({ error: 'No autenticado' });

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
  } finally {
    await session.close();
  }
};

export const createPost = async (req, res) => {
  if (!req.userId) return res.status(401).json({ error: 'No autenticado' });

  const session = driver.session();
  try {
    const { text } = req.body;
    let imageUrl = '';

    if (req.file) {
      imageUrl = `/uploads/${req.file.filename}`;
    }

    const r = await session.run(`
      MATCH (u:User {username:$username})
      CREATE (u)-[:HAS_POST]->(p:Post {
        id: randomUUID(), 
        text:$text, 
        imageUrl:$imageUrl, 
        createdAt: datetime()
      })
      RETURN u AS author, p AS post`,
      { username: req.userId, text, imageUrl }
    );

    const rec = r.records[0];
    return res.json({
      author: rec.get('author').properties,
      post: rec.get('post').properties,
      comments: 0
    });
  } catch (e) {
    res.status(400).json({ error: e.message });
  } finally {
    await session.close();
  }
};

export const deletePost = async (req, res) => {
  if (!req.userId) return res.status(401).json({ error: 'No autenticado' });

  const session = driver.session();
  try {
    const { id } = req.params;
    await session.run(`
      MATCH (u:User {username:$me})-[:HAS_POST]->(p:Post {id:$id})
      OPTIONAL MATCH (p)<-[:ON_POST]-(c:Comment)
      DETACH DELETE c, p
      `,
      { me: req.userId, id }
    );
    res.json({ ok: true });
  } catch (e) { 
    res.status(400).json({ error: e.message }); 
  }
  finally { 
    await session.close(); 
  }
}

export const getPost = async (req, res) => {
  if (!req.userId) return res.status(401).json({ error: 'No autenticado' });

  const session = driver.session();
  try {
    const { id } = req.params;
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
  } catch (e) { 
    res.status(400).json({ error: e.message }); 
  }
  finally { 
    await session.close(); 
  }
}