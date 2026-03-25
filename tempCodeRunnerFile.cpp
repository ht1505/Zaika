#include <bits/stdc++.h>
using namespace std;

long long solve(int N, vector<int> h) {

    vector<long long> L(N), R(N);
    stack<int> st;

    // LEFT COST
    for(int i = 0; i < N; i++) {
        while(!st.empty() && h[st.top()] >= h[i]) st.pop();

        if(st.empty()) {
            L[i] = 1LL * (i + 1) * h[i];
        } else {
            int p = st.top();
            L[i] = L[p] + 1LL * (i - p) * h[i];
        }
        st.push(i);
    }

    while(!st.empty()) st.pop();

    // RIGHT COST
    for(int i = N - 1; i >= 0; i--) {
        while(!st.empty() && h[st.top()] >= h[i]) st.pop();

        if(st.empty()) {
            R[i] = 1LL * (N - i) * h[i];
        } else {
            int p = st.top();
            R[i] = R[p] + 1LL * (p - i) * h[i];
        }
        st.push(i);
    }

    // CHECK FUNCTION
    auto ok = [&](long long X) {

        deque<int> dq;

        for(int r = 0; r < N; r++) {

            while(!dq.empty()) {
                int l = dq.back();

                // ✅ CORRECT FORMULA (important fix)
                long long cost = L[r] + R[l] - 1LL * h[l] * (r - l + 1);

                if(cost <= X) break;
                dq.pop_back();
            }

            dq.push_back(r);

            int l = dq.front();

            long long cost = L[r] + R[l] - 1LL * h[l] * (r - l + 1);

            if(cost <= X) return true;
        }

        return false;
    };

    // BINARY SEARCH
    long long lo = 0, hi = 1e14, ans = hi;

    while(lo <= hi) {
        long long mid = (lo + hi) / 2;

        if(ok(mid)) {
            ans = mid;
            hi = mid - 1;
        } else {
            lo = mid + 1;
        }
    }

    return ans;
}

int main() {
    ios::sync_with_stdio(0);
    cin.tie(0);

    int N;
    cin >> N;

    vector<int> h(N);
    for(int i = 0; i < N; i++) {
        cin >> h[i];
    }

    cout << solve(N, h);
}