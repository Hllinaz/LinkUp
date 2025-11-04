import {
    StateBaseHTML,
    Parameters,
    $, h
} from "./index.js";

export class Graph extends StateBaseHTML {
    async render() {
        this.root.innerHTML = '<div id="graph-canvas" class="graph-canvas"></div>';
        await this.loadGraph()
    }

    async loadGraph() {
        const canvas = this.root.querySelector('#graph-canvas');

        // La StateMachine deja los resultados en this.data
        console.debug('[GRAPH] data keys =>', Object.keys(this.data || {}));
        const payload = this.data && this.data['index/graph'];
        console.debug('[GRAPH] payload =>', payload);

        // Sin datos -> mensaje amable
        if (!payload || !payload.graph) {
            canvas.innerHTML = `
        <div style="padding:1rem;color:#2E2F3A;background:#fff;border-radius:12px">
          No hay datos de grafo disponibles.
        </div>`;
            return;
        }

        const graph = payload.graph._fields[0]; // { nodes: [...], links: [...] }
        console.log(graph)
        console.debug('[GRAPH] counts:', graph.nodes?.length, graph.links?.length);
        // Si no hay vecinos (o nada), avisar.
        // (Con la query robusta, como mínimo vendrá el nodo "me")
        if (!graph.nodes || graph.nodes.length <= 1) {
            canvas.innerHTML = `
        <div style="padding:1rem;color:#2E2F3A;background:#fff;border-radius:12px">
          Aún no hay conexiones para visualizar.
        </div>`;
            return;
        }

        // Asegura que solo pintamos relaciones FOLLOWS
        const edges = (graph.links || []).filter(e => (e.type || 'FOLLOWS') === 'FOLLOWS');

        // 4) Render Cytoscape
        const cy = cytoscape({
            container: canvas,
            elements: [
                ...graph.nodes.map(n => ({
                    data: {
                        id: n.id,
                        label: n.label,
                        isMe: !!n.isMe
                    }
                })),
                ...edges.map(e => ({
                    data: {
                        id: `${e.source}-${e.target}`,
                        source: e.source,
                        target: e.target,
                        type: 'FOLLOWS'
                    }
                }))
            ],
            layout: { name: 'cose', animate: true },
            style: [
                // Yo (nodo central)
                {
                    selector: 'node[isMe]',
                    style: {
                        'background-color': '#2B3A4F',
                        'label': 'data(label)',
                        'color': '#6c757d',
                        'font-weight': 'bold',
                        'text-valign': 'center',
                        'text-halign': 'center'
                    }
                },
                // Otros usuarios
                {
                    selector: 'node[!isMe]',
                    style: {
                        'background-color': '#d9e3e3',
                        'label': 'data(label)',
                        'color': '#333333',
                        'text-valign': 'center',
                        'text-halign': 'center'
                    }
                },
                // Relaciones
                {
                    selector: 'edge',
                    style: {
                        'curve-style': 'bezier',
                        'target-arrow-shape': 'triangle',
                        'width': 2
                    }
                }
            ]
        });

        // Ajuste automático de vista
        cy.ready(() => cy.fit());
        
        console.log(graph.nodes[0].id)
        const button = h('<button class="btn ver">Volver</button>')
        button.setAttribute('data-view', graph.nodes[0].id)
        canvas.appendChild(button)
    }
}

export function getGraph(username) {
    return new Graph(Parameters.GRAPH(username), '.content-feed');
}