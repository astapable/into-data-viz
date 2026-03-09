## What This Example Shows

This visualization reveals the **key insight of the famous Iris dataset**: different iris flower species can be distinguished by their petal length.

## The Iris Dataset

The [Iris flower dataset](https://en.wikipedia.org/wiki/Iris_flower_data_set) was introduced by statistician Ronald Fisher in 1936. It contains measurements of 150 iris flowers from three species:

- **Setosa** (*Iris setosa*)
- **Versicolor** (*Iris versicolor*)  
- **Virginica** (*Iris virginica*)

For each flower, four features were measured: sepal length, sepal width, petal length, and petal width.

## What "Dominant Species" Means

In this visualization:

1. **Bins** group flowers by petal length ranges (e.g., 1.0-2.0 cm, 2.0-3.0 cm)
2. **Dominant species** = the species that appears most frequently in that bin
3. **Color** shows which species dominates each petal length range

### Example:
If a bin covers petals 1.0-2.0 cm long and contains:
- 15 Setosa flowers
- 2 Versicolor flowers
- 0 Virginica flowers

Then **Setosa is dominant** (15 > 2) and the bar appears **red**.

## The Key Insight

The color pattern reveals:
- **Red bars** (Setosa): Short petals (~1-2 cm)
- **Blue bars** (Versicolor): Medium petals (~3-5 cm)
- **Green bars** (Virginica): Long petals (~5-7 cm)

This shows that **petal length alone is enough to distinguish the three species** - which is why this dataset became foundational for teaching classification algorithms in machine learning.

## References

- [Iris flower dataset (Wikipedia)](https://en.wikipedia.org/wiki/Iris_flower_data_set)
