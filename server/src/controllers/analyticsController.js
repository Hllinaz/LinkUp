import driver from '../config/database.js';
import { asInt } from '../utils/helpers.js'

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
        const r = await session.run(`
            MATCH (i:Interest)<-[:INTEREST_IN]-(u:User)
            WITH i as interest, collect(DISTINCT u{name: u.name, username: u.username}) as user
            RETURN collect({interest: interest.name, users: user}) as communities`);
        const rec = r.records[0]
        res.json(rec.get('communities'));
    } catch (e) { res.status(400).json({ error: e.message }); }
    finally { await session.close(); }
}

export const getUser = async (req, res) => {
    const session = driver.session();
    try {
        const r = await session.run(`
            MATCH (i:Interest)<-[:INTEREST_IN]-(u:User)
            RETURN i as interest`);
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
            WITH u, count(*) AS followers, exists((:User {username: $username})-[:FOLLOWS]->(u)) as isFollowing
            OPTIONAL MATCH(user:User {username: $username})
            WITH u, followers, isFollowing, (u.username = user.username) as isME
            RETURN u{.*, username:u.username, followers: followers, isFollowing: isFollowing, isMe: isME}
            ORDER BY followers DESC, u.createdAt DESC
            LIMIT 20`,
            { username: req.userId }
        );
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
            MATCH (me:User {username: $username})

            // Siguiendo yo -> otros
            OPTIONAL MATCH (me)-[:FOLLOWS]->(f:User)
            WITH me, collect(DISTINCT f) AS following

            // Otros -> me (seguidores)
            OPTIONAL MATCH (u:User)-[:FOLLOWS]->(me)
            WITH me, following, collect(DISTINCT u) AS followers

            // Vecindario (uniendo ambos lados)
            WITH me, following, followers, following + followers AS both
            UNWIND both AS n
            WITH me, following, followers, collect(DISTINCT n) AS neigh

            // IDs robustos:
            // 1) username, 2) email, 3) elementId(n) como fallback
            WITH
            me,
            following,
            followers,
                    neigh,
                    coalesce(me.username, me.email, elementId(me)) AS meId,
            [x IN neigh | coalesce(x.username, x.email, elementId(x))] AS neighIds,
                    neigh AS neighNodes

                // Construcción de nodos (me + vecinos) con flags
            WITH me, meId, following, followers, neighNodes, neighIds,
            [i IN range(0, size(neighNodes)-1) |
            {
            id: neighIds[i],
            label: coalesce(neighNodes[i].name, neighNodes[i].username, neighNodes[i].email, neighIds[i]),
            i_follow: neighNodes[i] IN following,
            follows_me: neighNodes[i] IN followers,
            mutual: (neighNodes[i] IN following) AND (neighNodes[i] IN followers)
            }
            ] AS nodes

            // Links solo FOLLOWS con los mismos IDs
            WITH me, meId, nodes,
            [n IN nodes WHERE n.i_follow   | { source: meId, target: n.id, type: 'FOLLOWS' }] +
            [n IN nodes WHERE n.follows_me | { source: n.id,  target: meId, type: 'FOLLOWS' }] AS links

            RETURN {
            nodes: [{ id: meId, label: coalesce(me.name, me.username, me.email, meId), isMe: true }] + nodes,
            links: links
            } AS graph`,
            { username }
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