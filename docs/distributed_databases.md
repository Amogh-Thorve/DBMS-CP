# STVAMS Distributed Database Architecture

## 1. Multi-Zone Horizontal Data Fragmentation

In STVAMS, metropolitan traffic monitoring is modeled across distributed regional zones:

```text
[Central Gateway Node]
         |
  +------+------+------+
  |             |      |
  v             v      v
[Zone Node A] [Zone Node B] [Zone Node C]
(Mumbai)      (Delhi)       (Bengaluru)
```

### Horizontal Fragmentation Strategy:
* **Fragment $F_1$ (Mumbai Zone):** $\sigma_{\text{city\_id}=1}(\text{VIOLATION})$
* **Fragment $F_2$ (Delhi Zone):** $\sigma_{\text{city\_id}=2}(\text{VIOLATION})$
* **Fragment $F_3$ (Bengaluru Zone):** $\sigma_{\text{city\_id}=3}(\text{VIOLATION})$

---

## 2. Distributed Query Processing Example

A global query requesting national traffic violation revenue:

$$\text{Total Revenue} = \sum \text{Fragment}_1 \cup \sum \text{Fragment}_2 \cup \sum \text{Fragment}_3$$

Distributed query optimizers push predicate filtering down to regional nodes prior to network transmission, reducing cross-datacenter payload bandwidth.
