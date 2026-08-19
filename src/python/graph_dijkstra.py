import heapq

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
    print("======================================\n")

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
