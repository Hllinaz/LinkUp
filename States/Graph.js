class Graph extends StateBaseHTML {
    async render() {
        this.root.innerHTML = '';
        await this.loadGraph()
    }

    async loadGraph() {
        const result = this.data['index/graph'].graph
        const graph = result._fields[0]
        console.log(graph)
        const cy = cytoscape({
            container: this.root,
            elements: [
                ...graph.nodes.map(n => ({
                    data: {
                        id: n.id,
                        label: n.label,
                        isMe: n.isMe  // Asegúrate de que esto existe
                    }
                })),
                ...graph.links.map(e => ({
                    data: {
                        id: e.id,
                        source: e.source,
                        target: e.target
                    }
                }))
            ],
            layout: { name: "cose" },
            style: [
                {
                    selector: "node",
                    style: {
                        "background-color": "data()",
                        "label": "data(label)",
                        "color": "#2E2F3A",
                        "font-size": "12px",
                        "text-valign": "center",
                        "text-halign": "center"
                    }
                },
                {
                    selector: "edge",
                    style: {
                        "curve-style": "bezier",
                        "target-arrow-shape": "triangle",
                        "width": 2,
                        "line-color": "#A8D0CD",
                        "target-arrow-color": "#A8D0CD"
                    }
                }
            ]
        });
    }
}

function getGraph(username) {
    return new Graph(GRAPH(username), '.content-feed');
}