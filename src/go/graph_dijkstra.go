package main

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

	fmt.Printf("Dijkstra's Shortest Path from node %d:\n", source)
	fmt.Println("======================================")
	fmt.Println()

	for pq.Len() > 0 {
		top := heap.Pop(pq).(item)
		d, u := top.dist, top.node

		if visited[u] {
			continue
		}
		visited[u] = true

		fmt.Printf("Processing node %d (distance = %d)\n", u, d)

		for _, e := range adj[u] {
			w, weight := e.to, e.weight
			if !visited[w] {
				if dist[u]+weight < dist[w] {
					dist[w] = dist[u] + weight
					heap.Push(pq, item{dist[w], w})
					fmt.Printf("  Updated distance to node %d: %d\n", w, dist[w])
				}
			}
		}

		fmt.Println()
	}

	fmt.Printf("Final shortest distances from node %d:\n", source)
	for i := 0; i < v; i++ {
		if dist[i] == inf {
			fmt.Printf("Node %d: INF (unreachable)\n", i)
		} else {
			fmt.Printf("Node %d: %d\n", i, dist[i])
		}
	}
}
