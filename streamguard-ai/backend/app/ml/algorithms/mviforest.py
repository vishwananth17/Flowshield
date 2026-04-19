import numpy as np

class IsolationTree:
    """Single isolation tree (itree) as per paper Algorithm 1"""

    def __init__(self, max_depth: int):
        self.max_depth = max_depth
        self.split_dimension = None
        self.split_value = None
        self.left = None
        self.right = None
        self.size = 0
        self.is_leaf = False

    def fit(self, X: np.ndarray, depth: int = 0):
        """
        Build isolation tree recursively.
        Paper Algorithm 1: iTree(X, e, l)
        """
        n = len(X)
        self.size = n

        if n <= 1 or depth >= self.max_depth:
            self.is_leaf = True
            return self

        # Randomly select split dimension
        n_features = X.shape[1]
        self.split_dimension = np.random.randint(0, n_features)

        col = X[:, self.split_dimension]
        col_min, col_max = col.min(), col.max()

        if col_min == col_max:
            self.is_leaf = True
            return self

        # Randomly select split value between min and max
        self.split_value = np.random.uniform(col_min, col_max)

        left_mask = col < self.split_value
        right_mask = ~left_mask

        self.left = IsolationTree(self.max_depth)
        self.right = IsolationTree(self.max_depth)
        self.left.fit(X[left_mask], depth + 1)
        self.right.fit(X[right_mask], depth + 1)

        return self

    def path_length(self, x: np.ndarray, current_depth: int = 0) -> float:
        """
        Paper Algorithm 2: PathLength(x, Ti, e)
        Returns path length of x in this tree.
        """
        if self.is_leaf:
            return current_depth + self._c(self.size)

        if x[self.split_dimension] < self.split_value:
            return self.left.path_length(x, current_depth + 1)
        else:
            return self.right.path_length(x, current_depth + 1)

    @staticmethod
    def _c(n: int) -> float:
        """
        Average path length of unsuccessful BST search.
        Paper formula: C(n) = 2*H(n-1) - 2*(n-1)/n
        """
        if n <= 1:
            return 0.0
        if n == 2:
            return 1.0
        return 2.0 * (np.log(n - 1) + 0.5772156649) - (2.0 * (n - 1) / n)


class MVIForest:
    """
    Majority Voting Isolation Forest
    Implementation based on paper Section VII.
    """

    def __init__(self,
                 n_estimators: int = 100,
                 sample_size: int = None,
                 threshold: float = 0.6,
                 random_state: int = 42):
        self.n_estimators = n_estimators
        self.sample_size = sample_size
        self.threshold = threshold
        self.random_state = random_state
        self.trees: list[IsolationTree] = []
        self.psi: int = 0
        self.c_psi: float = 0.0
        self._is_fitted = False

    def fit(self, X: np.ndarray) -> 'MVIForest':
        """
        Training phase: build forest of isolation trees.
        """
        np.random.seed(self.random_state)
        n_samples = X.shape[0]

        # Determine sample size ψ
        self.psi = self.sample_size or min(256, n_samples)
        max_depth = int(np.ceil(np.log2(self.psi)))
        self.c_psi = IsolationTree._c(self.psi)

        self.trees = []
        for _ in range(self.n_estimators):
            # Random sample WITHOUT replacement (paper requirement)
            indices = np.random.choice(n_samples, size=self.psi, replace=False)
            sample = X[indices]

            tree = IsolationTree(max_depth)
            tree.fit(sample)
            self.trees.append(tree)

        self._is_fitted = True
        return self

    def _score_one_tree(self, x: np.ndarray, tree: IsolationTree) -> float:
        """
        Paper formula: si(x,n) = 2^(-hi(x)/C(n))
        """
        h = tree.path_length(x)
        return 2.0 ** (-h / self.c_psi)

    def score_samples(self, X: np.ndarray) -> np.ndarray:
        """
        MVIForest scoring phase with majority voting.
        Paper Section VII-A: stop when t/2 + 1 trees agree.
        """
        if not self._is_fitted:
            raise RuntimeError("Call fit() before score_samples()")

        n_samples = X.shape[0]
        majority_threshold = self.n_estimators // 2 + 1
        scores = np.zeros(n_samples)

        for i in range(n_samples):
            x = X[i]
            anomaly_votes = 0
            normal_votes = 0
            score_sum = 0.0
            trees_used = 0

            for tree in self.trees:
                tree_score = self._score_one_tree(x, tree)
                score_sum += tree_score
                trees_used += 1

                # Vote based on threshold
                if tree_score > self.threshold:
                    anomaly_votes += 1
                else:
                    normal_votes += 1

                # Check if majority reached — STOP EARLY
                if anomaly_votes >= majority_threshold or normal_votes >= majority_threshold:
                    break

            # Final score = average of trees used
            final_score = score_sum / trees_used
            scores[i] = -final_score  # negative for sklearn compat

        return scores

    def predict(self, X: np.ndarray) -> np.ndarray:
        """
        Returns: -1 for anomaly (fraud), 1 for normal
        """
        scores = self.score_samples(X)
        return np.where(scores < -self.threshold, -1, 1)

    def decision_function(self, X: np.ndarray) -> np.ndarray:
        """Returns anomaly scores (more negative = more anomalous)"""
        return self.score_samples(X)

    def anomaly_score(self, X: np.ndarray) -> np.ndarray:
        """
        Returns fraud probability scores in [0, 1].
        """
        raw_scores = -self.score_samples(X)
        return np.clip(raw_scores, 0, 1)

    def save(self, path: str):
        """Save trained model to disk"""
        import joblib
        joblib.dump(self, path)

    @classmethod
    def load(cls, path: str) -> 'MVIForest':
        """Load trained model from disk"""
        import joblib
        return joblib.load(path)
