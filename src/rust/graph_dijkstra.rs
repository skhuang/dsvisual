use std::cmp::Reverse;
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
    println!("======================================\n");

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
