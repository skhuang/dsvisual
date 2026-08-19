<?php

const INF = 1000000000;

function dijkstra(array $adj, int $v, int $source): array
{
    $dist = array_fill(0, $v, INF);
    $visited = array_fill(0, $v, false);

    // Min-priority-queue keyed by distance: SplPriorityQueue is a max-heap,
    // so invert the priority (negate the distance) to get min-first order.
    $pq = new SplPriorityQueue();
    $pq->setExtractFlags(SplPriorityQueue::EXTR_DATA);

    $dist[$source] = 0;
    $pq->insert(['dist' => 0, 'node' => $source], -0);

    echo "Dijkstra's Shortest Path from node $source:\n";
    echo "======================================\n\n";

    while (!$pq->isEmpty()) {
        $top = $pq->extract();
        $d = $top['dist'];
        $u = $top['node'];

        if ($visited[$u]) {
            continue;
        }
        $visited[$u] = true;

        echo "Processing node $u (distance = $d)\n";

        foreach ($adj[$u] as $edge) {
            [$w, $weight] = $edge;
            if (!$visited[$w]) {
                if ($dist[$u] + $weight < $dist[$w]) {
                    $dist[$w] = $dist[$u] + $weight;
                    $pq->insert(['dist' => $dist[$w], 'node' => $w], -$dist[$w]);
                    echo "  Updated distance to node $w: {$dist[$w]}\n";
                }
            }
        }

        echo "\n";
    }

    return $dist;
}

function main(): void
{
    $v = 5;
    $adj = array_fill(0, $v, []); // adjacency list: [neighbor, weight]

    $addEdge = function (int $u, int $w, int $weight) use (&$adj) {
        $adj[$u][] = [$w, $weight];
        $adj[$w][] = [$u, $weight];
    };

    $addEdge(0, 1, 4);
    $addEdge(0, 2, 1);
    $addEdge(1, 2, 2);
    $addEdge(1, 3, 3);
    $addEdge(2, 3, 1);
    $addEdge(3, 4, 3);
    $addEdge(2, 4, 5);

    $source = 0;
    $dist = dijkstra($adj, $v, $source);

    echo "Final shortest distances from node $source:\n";
    for ($i = 0; $i < $v; $i++) {
        if ($dist[$i] === INF) {
            echo "Node $i: INF (unreachable)\n";
        } else {
            echo "Node $i: {$dist[$i]}\n";
        }
    }
}

main();
