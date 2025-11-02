import driver from '../config/database.js';

export const getRecommendations = async (req, res) => {
    if (!req.userId) return res.status(401).json({ error: 'No autenticado' });
    const session = driver.session();
    try {
        const r = await session.run(`
            MATCH (me:User {username:$me})
            MATCH (u:User)
            WHERE u <> me AND NOT (me)-[:FOLLOWS]->(u)
            OPTIONAL MATCH (me)-[:INTEREST_IN]->(i:Interest)<-[:INTEREST_IN]-(u)
            WITH u, count(i) AS sharedInterests
            OPTIONAL MATCH (me)-[:FOLLOWS]->(:User)-[:FOLLOWS]->(u)
            WITH u, sharedInterests, count(*) AS mutuals
            RETURN u{.*, username:u.username, sharedInterests:sharedInterests, mutuals:mutuals}
            ORDER BY sharedInterests DESC, mutuals DESC, u.createdAt DESC
            LIMIT 10`,
            { me: req.userId }
        );
        res.json(r.records.map(x => x.get(0)));
    } catch (e) {
        res.status(400).json({ error: e.message });
    }
    finally {
        await session.close();
    }
}

export const getCommunities = async (req, res) => {
    const session = driver.session();
    try {
        const r = await session.run( `
            MATCH (i:Interest)<-[:INTEREST_IN]-(u:User)
            RETURN i.name AS name, count(u) AS members
            ORDER BY members DESC, name ASC
            LIMIT 20 `);
        res.json(r.records.map(rec => ({
            name: rec.get('name'),
            members: asInt(rec.get('members'))
        })));
    } catch (e) { res.status(400).json({ error: e.message }); }
    finally { await session.close(); }
}

export const getTop = async (req, res) => {
    const session = driver.session();

    try {
        const r = await session.run(`
            MATCH (u:User)
            OPTIONAL MATCH (u)<-[:FOLLOWS]-(:User)
            WITH u, count(*) AS followers
            RETURN u{.*, username:u.username, followers: followers}
            ORDER BY followers DESC, u.createdAt DESC
            LIMIT 20`);
        res.json(r.records.map(rec => {
            const o = rec.get(0);
            o.followers = asInt(o.followers);
            return o;
        }));
    } catch (e) {
        res.status(400).json({ error: e.message });
    }
    finally {
        await session.close();
    }
}

export const getGraph = async (req, res) => {
    const session = driver.session();

    try {
        const { username } = req.params;
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
        if (r.length === 0) {
            res.json({ nodes: [], links: [] });
        }
        const result = r.records[0]
        res.json({ graph: result });
    } catch (e) {
        res.status(400).json({ error: e.message });
    }
    finally {
        await session.close();
    }
}