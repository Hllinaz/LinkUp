import driver from '../config/database.js';
import { hashPassword, sign } from '../utils/helpers.js'

export const getUser = async (req, res) => {
    const session = driver.session();
    try {
        const { id } = req.params;
        const r = await session.run(`
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
            posts: posts } AS profile `,
            { username: id }
        );
        if (!r.records.length) return res.status(404).json({ error: 'Usuario no existe' });
        res.json(r.records[0].get('profile'));
    } catch (e) {
        res.status(400).json({ error: e.message });
    }
    finally {
        await session.close();

    }
}

export const isFollowing = async (req, res) => {
    if (!req.userId) return res.status(401).json({ error: 'No autenticado' });
    const session = driver.session();
    try {
        const { id } = req.params;
        const r = await session.run(`
            MATCH (me:User {username: $username}), (user:User {username: $otherUsername})
            RETURN EXISTS((me)-[:FOLLOWS]->(user)) AS isFollowing`,
            { username: req.userId, otherUsername: id }
        );
        res.json(r.records[0].get('isFollowing'));
    } catch (e) { res.status(400).json({ error: e.message }); }
    finally { await session.close(); }
}

export const Follow = async (req, res) => {
    if (!req.userId) return res.status(401).json({ error: 'No autenticado' });
    const session = driver.session();
    try {
        const { id } = req.params;
        await session.run(`
            MATCH (me:User {username:$me}), (u:User {username:$u})
            MERGE (me)-[:FOLLOWS]->(u)`,
            { me: req.userId, u: id }
        );
        res.json({ ok: true });
    } catch (e) {
        res.status(400).json({ error: e.message });
    }
    finally {
        await session.close();
    }
}

export const Unfollow = async (req, res) => {
    if (!req) return res.status(401).json({ error: 'No autenticado' });
    const session = driver.session();
    try {
        const { id } = req.params;
        await session.run(`
            MATCH (me:User {username:$me})-[r:FOLLOWS]->(u:User {username:$u})
            DELETE r`,
            { me: req.userId, u: id }
        );
        res.json({ ok: true });
    } catch (e) {
        res.status(400).json({ error: e.message });
    }
    finally {
        await session.close();
    }
}

export const isMe = async (req, res) => {

    if (!req.userId) return res.status(401).json({ error: 'No autenticado' });
    const session = driver.session();
    try {
        const { id } = req.params;
        const r = await session.run(`
            MATCH(user:User {username: $me})
            RETURN user.username = $otherUser as isMe`,
            { me: req.userId, otherUser: id }
        );
        res.json(r.records[0].get('isMe'))
    } catch (e) {
        res.status(400).json({ error: e.message });
    }
    finally {
        await session.close();
    }
}

export const getMe = async (req, res) => {
    if (!req.userId) return res.status(401).json({ error: 'No autenticado' });
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
    } catch (e) {
        res.status(400).json({ error: e.message });
    }
    finally {
        await session.close();
    }
}

export const putMe = async (req, res) => {
    if (!req.userId) return res.status(401).json({ error: 'No autenticado' });
    const session = driver.session();
    try {
        const { name, username, email, password, interest } = req.body;
        const hashedPassword = await hashPassword(password);
        console.log(interest)
        const r = await session.run(`
            MATCH (user:User {username:$me})
            SET 
            user.name = coalesce($name, user.name), 
            user.username = coalesce($username, user.username),
            user.email = coalesce($email, user.email), 
            user.password = coalesce($password, user.password)
            WITH user
            WHERE $interest IS NOT NULL AND size($interest) > 0
            // Eliminar todas las relaciones de intereses existentes
            OPTIONAL MATCH (user)-[r:INTEREST_IN]->(:Interest)
            DELETE r

            // Crear nuevos intereses y relaciones
            WITH user
            UNWIND $interest AS interestName
            MERGE (interest:Interest {name: trim(toLower(interestName))})
            MERGE (user)-[:INTEREST_IN]->(interest)

            // Retornar el usuario actualizado
            WITH DISTINCT user
            RETURN user AS updatedUser`,
            { me: req.userId, username, name, password: hashedPassword, email, interest }
        );
        const token = sign(username);
        res.json({ ok: true, token: token });
    } catch (e) {
        res.status(400).json({ error: e.message });
    }
    finally {
        await session.close();
    }
}

export const getInterests = async (req, res) => {
    if (!req.userId) return res.status(401).json({ error: 'No autenticado' });

    const session = driver.session();
    try {

        const r = await session.run(`
            MATCH (i:Interest)
            WHERE not (:User {username:$me})-[:INTEREST_IN]-(i)
            RETURN collect(i{.*}) as interest`,
            { me: req.userId }
        );
        const interests = r.records[0].get('interest')
        res.json({ interest: interests });
    } catch (e) {
        res.status(400).json({ error: e.message });
    }
    finally {
        await session.close();
    }
}

export const createInterests = async (req, res) => {
    if (!req.userId) return res.status(401).json({ error: 'No autenticado' });
    const session = driver.session();
    try {
        const { interest } = req.body;
        await session.run(`
            CREATE (i:Interest {name: $interest})
            WITH i
            MATCH (i:Interest {name: $interest})
            MATCH (u:User {username: $me})
            CREATE (u)-[:INTEREST_IN]->(i)`,
            { interest, me: req.userId }
        );

        res.json({ ok: true });
    } catch (e) {
        res.status(400).json({ error: e.message });
    }
    finally {
        await session.close();
    }
}

export const connectInterest = async (req, res) => {
    if (!req.userId) return res.status(401).json({ error: 'No autenticado' });
    const session = driver.session();
    try {
        const { interest } = req.body;
        await session.run(`
            MATCH (i:Interest {name: $interest})
            MATCH (u:User {username: $me})
            CREATE (u)-[:INTEREST_IN]->(i)`,
            { interest, me: req.userId }
        );

        res.json({ ok: true });
    } catch (e) {
        res.status(400).json({ error: e.message });
    }
    finally {
        await session.close();
    }
}