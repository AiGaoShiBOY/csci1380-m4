# M4: Distributed Storage

> Full name: `Yuanfeng Li`
> Email: `yuanfeng_li@brown.edu`
> Username: `yli586`

## Summary

> Summarize your implementation, including key challenges you encountered

My implementation comprises `4` new software components, totaling `700` added lines of code over the previous implementation. Key challenges included:

> 1. How to correctly use the fs component. I solved it by reading official document.
> 2. How to correcly use the given hash function without changing the original order. I solved it by creating a shadow copy of nids using nids.slice().
> 3. How to run tests locally. I solved it by creating an enviroment locally.

## Correctness & Performance Characterization

> Describe how you characterized the correctness and performance of your implementation

_Correctness_: I wrote `5` tests; these tests take `0.347` to execute.

_Performance_: Storing and retrieving 1000 5-property objects using a 3-node setup results in following average throughput and latency characteristics: `1.65ms`obj/sec and `6.21` (ms/object) (Note: these objects were pre-generated in memory to avoid accounting for any performance overheads of generating these objects between experiments).

## Key Feature

> Why is the `reconf` method designed to first identify all the keys to be relocated and then relocate individual objects instead of fetching all the objects immediately and then pushing them to their corresponding locations?

During reconf, we need to reallocate nodes that require relocation. This involves not only placing them on new nodes but also removing data from the original nodes to prevent data redundancy. Therefore, we need to operate on each node to complete the 2 steps above. Moreover, for nodes that are determined not to require relocation through calculation, we can leave them as is. This approach, as opposed to fetching all objects immediately and then pushing them to their corresponding locations, which requires operating on every object, significantly improves efficiency.

## Time to Complete

> Roughly, how many hours did this milestone take you to complete?

Hours: `48h`
