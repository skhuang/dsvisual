// Auto-generated multi-language code DB — edit src/<lang>/*, then run: node build_multilang.js
const CODE_MULTILANG = {
    "graph-dijkstra": {
        python: `import heapq

INF = float('inf')


def main():
    V = 5
    adj = [[] for _ in range(V)]  # adjacency list: (neighbor, weight)

    def add_edge(u, v, w):
        adj[u].append((v, w))
        adj[v].append((u, w))

    add_edge(0, 1, 4)
    add_edge(0, 2, 1)
    add_edge(1, 2, 2)
    add_edge(1, 3, 3)
    add_edge(2, 3, 1)
    add_edge(3, 4, 3)
    add_edge(2, 4, 5)

    source = 0
    dist = [INF] * V
    visited = [False] * V
    pq = []  # min-heap of (distance, node)

    dist[source] = 0
    heapq.heappush(pq, (0, source))

    print(f"Dijkstra's Shortest Path from node {source}:")
    print("======================================\\n")

    while pq:
        d, u = heapq.heappop(pq)

        if visited[u]:
            continue
        visited[u] = True

        print(f"Processing node {u} (distance = {d})")

        for v, w in adj[u]:
            if not visited[v]:
                if dist[u] + w < dist[v]:
                    dist[v] = dist[u] + w
                    heapq.heappush(pq, (dist[v], v))
                    print(f"  Updated distance to node {v}: {dist[v]}")

        print()

    print(f"Final shortest distances from node {source}:")
    for i in range(V):
        if dist[i] == INF:
            print(f"Node {i}: INF (unreachable)")
        else:
            print(f"Node {i}: {dist[i]}")


if __name__ == "__main__":
    main()
`,
        rust: `use std::cmp::Reverse;
use std::collections::BinaryHeap;

const INF: i64 = 1_000_000_000;

fn main() {
    let v = 5usize;
    let mut adj: Vec<Vec<(usize, i64)>> = vec![Vec::new(); v];

    let add_edge = |adj: &mut Vec<Vec<(usize, i64)>>, u: usize, w: usize, weight: i64| {
        adj[u].push((w, weight));
        adj[w].push((u, weight));
    };

    add_edge(&mut adj, 0, 1, 4);
    add_edge(&mut adj, 0, 2, 1);
    add_edge(&mut adj, 1, 2, 2);
    add_edge(&mut adj, 1, 3, 3);
    add_edge(&mut adj, 2, 3, 1);
    add_edge(&mut adj, 3, 4, 3);
    add_edge(&mut adj, 2, 4, 5);

    let source = 0usize;
    let mut dist = vec![INF; v];
    let mut visited = vec![false; v];
    let mut pq: BinaryHeap<Reverse<(i64, usize)>> = BinaryHeap::new();

    dist[source] = 0;
    pq.push(Reverse((0, source)));

    println!("Dijkstra's Shortest Path from node {}:", source);
    println!("======================================\\n");

    while let Some(Reverse((d, u))) = pq.pop() {
        if visited[u] {
            continue;
        }
        visited[u] = true;

        println!("Processing node {} (distance = {})", u, d);

        for &(w, weight) in &adj[u] {
            if !visited[w] {
                if dist[u] + weight < dist[w] {
                    dist[w] = dist[u] + weight;
                    pq.push(Reverse((dist[w], w)));
                    println!("  Updated distance to node {}: {}", w, dist[w]);
                }
            }
        }

        println!();
    }

    println!("Final shortest distances from node {}:", source);
    for i in 0..v {
        if dist[i] == INF {
            println!("Node {}: INF (unreachable)", i);
        } else {
            println!("Node {}: {}", i, dist[i]);
        }
    }
}
`,
        go: `package main

import (
	"container/heap"
	"fmt"
)

const inf = 1000000000

// edge is a (neighbor, weight) pair in an adjacency list.
type edge struct {
	to, weight int
}

// item is a (distance, node) pair stored in the priority queue.
type item struct {
	dist, node int
}

// minHeap is a min-priority-queue of items ordered by distance.
type minHeap []item

func (h minHeap) Len() int            { return len(h) }
func (h minHeap) Less(i, j int) bool  { return h[i].dist < h[j].dist }
func (h minHeap) Swap(i, j int)       { h[i], h[j] = h[j], h[i] }
func (h *minHeap) Push(x interface{}) { *h = append(*h, x.(item)) }
func (h *minHeap) Pop() interface{} {
	old := *h
	n := len(old)
	x := old[n-1]
	*h = old[:n-1]
	return x
}

func main() {
	const v = 5
	adj := make([][]edge, v) // adjacency list: {neighbor, weight}

	addEdge := func(u, w, weight int) {
		adj[u] = append(adj[u], edge{w, weight})
		adj[w] = append(adj[w], edge{u, weight})
	}

	addEdge(0, 1, 4)
	addEdge(0, 2, 1)
	addEdge(1, 2, 2)
	addEdge(1, 3, 3)
	addEdge(2, 3, 1)
	addEdge(3, 4, 3)
	addEdge(2, 4, 5)

	source := 0
	dist := make([]int, v)
	visited := make([]bool, v)
	for i := range dist {
		dist[i] = inf
	}

	pq := &minHeap{}
	heap.Init(pq)

	dist[source] = 0
	heap.Push(pq, item{0, source})

	fmt.Printf("Dijkstra's Shortest Path from node %d:\\n", source)
	fmt.Println("======================================")
	fmt.Println()

	for pq.Len() > 0 {
		top := heap.Pop(pq).(item)
		d, u := top.dist, top.node

		if visited[u] {
			continue
		}
		visited[u] = true

		fmt.Printf("Processing node %d (distance = %d)\\n", u, d)

		for _, e := range adj[u] {
			w, weight := e.to, e.weight
			if !visited[w] {
				if dist[u]+weight < dist[w] {
					dist[w] = dist[u] + weight
					heap.Push(pq, item{dist[w], w})
					fmt.Printf("  Updated distance to node %d: %d\\n", w, dist[w])
				}
			}
		}

		fmt.Println()
	}

	fmt.Printf("Final shortest distances from node %d:\\n", source)
	for i := 0; i < v; i++ {
		if dist[i] == inf {
			fmt.Printf("Node %d: INF (unreachable)\\n", i)
		} else {
			fmt.Printf("Node %d: %d\\n", i, dist[i])
		}
	}
}
`,
        php: `<?php

const INF = 1000000000;

function dijkstra(array \$adj, int \$v, int \$source): array
{
    \$dist = array_fill(0, \$v, INF);
    \$visited = array_fill(0, \$v, false);

    // Min-priority-queue keyed by distance: SplPriorityQueue is a max-heap,
    // so invert the priority (negate the distance) to get min-first order.
    \$pq = new SplPriorityQueue();
    \$pq->setExtractFlags(SplPriorityQueue::EXTR_DATA);

    \$dist[\$source] = 0;
    \$pq->insert(['dist' => 0, 'node' => \$source], -0);

    echo "Dijkstra's Shortest Path from node \$source:\\n";
    echo "======================================\\n\\n";

    while (!\$pq->isEmpty()) {
        \$top = \$pq->extract();
        \$d = \$top['dist'];
        \$u = \$top['node'];

        if (\$visited[\$u]) {
            continue;
        }
        \$visited[\$u] = true;

        echo "Processing node \$u (distance = \$d)\\n";

        foreach (\$adj[\$u] as \$edge) {
            [\$w, \$weight] = \$edge;
            if (!\$visited[\$w]) {
                if (\$dist[\$u] + \$weight < \$dist[\$w]) {
                    \$dist[\$w] = \$dist[\$u] + \$weight;
                    \$pq->insert(['dist' => \$dist[\$w], 'node' => \$w], -\$dist[\$w]);
                    echo "  Updated distance to node \$w: {\$dist[\$w]}\\n";
                }
            }
        }

        echo "\\n";
    }

    return \$dist;
}

function main(): void
{
    \$v = 5;
    \$adj = array_fill(0, \$v, []); // adjacency list: [neighbor, weight]

    \$addEdge = function (int \$u, int \$w, int \$weight) use (&\$adj) {
        \$adj[\$u][] = [\$w, \$weight];
        \$adj[\$w][] = [\$u, \$weight];
    };

    \$addEdge(0, 1, 4);
    \$addEdge(0, 2, 1);
    \$addEdge(1, 2, 2);
    \$addEdge(1, 3, 3);
    \$addEdge(2, 3, 1);
    \$addEdge(3, 4, 3);
    \$addEdge(2, 4, 5);

    \$source = 0;
    \$dist = dijkstra(\$adj, \$v, \$source);

    echo "Final shortest distances from node \$source:\\n";
    for (\$i = 0; \$i < \$v; \$i++) {
        if (\$dist[\$i] === INF) {
            echo "Node \$i: INF (unreachable)\\n";
        } else {
            echo "Node \$i: {\$dist[\$i]}\\n";
        }
    }
}

main();
`,
    },
};

if (typeof window !== 'undefined') window.CODE_MULTILANG = CODE_MULTILANG;
if (typeof module !== 'undefined' && module.exports) module.exports = CODE_MULTILANG;
