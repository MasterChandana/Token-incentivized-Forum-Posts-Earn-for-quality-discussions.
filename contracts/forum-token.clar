;; Token-Incentivized Forum Posts Contract
;; A Clarity smart contract for earning tokens through quality discussions

;; Define the forum token
(define-fungible-token forum-token)

;; Constants
(define-constant contract-owner tx-sender)
(define-constant err-owner-only (err u100))



(define-constant err-invalid-amount (err u102))

;; Token metadata
(define-data-var token-name (string-ascii 32) "Forum Token")
(define-data-var token-symbol (string-ascii 10) "FORUM")
(define-data-var token-decimals uint u6)

;; Forum state
(define-data-var total-supply uint u0)
(define-data-var total-posts uint u0)

;; Post tracking - simplified
(define-map posts
  uint
  principal
)
(define-map post-content
  uint
  (string-ascii 100)
)

;; Initialize the contract with initial supply
(define-public (initialize (initial-supply uint))
  (begin
    (asserts! (is-eq tx-sender contract-owner) err-owner-only)
    (asserts! (> initial-supply u0) err-invalid-amount)
    (try! (ft-mint? forum-token initial-supply tx-sender))
    (var-set total-supply initial-supply)
    (ok true)
  )
)

;; Function 1: Create a new forum post
(define-public (create-post (content (optional (string-ascii 100))))
  (begin
    (asserts! (is-some content) err-invalid-amount)
    (let ((post-id (+ (var-get total-posts) u1)))
      ;; Create the post
      (map-set posts post-id tx-sender)
      (map-set post-content post-id (unwrap! content err-invalid-amount))

      ;; Update total posts
      (var-set total-posts post-id)

      (ok post-id)
    )
  )
)

;; Function 2: Reward a quality post with tokens
(define-public (reward-post
    (post-id uint)
    (reward-amount uint)
  )
  (begin
    (asserts! (> post-id u0) err-invalid-amount)
    (asserts! (<= post-id (var-get total-posts)) err-invalid-amount)
    (asserts! (> reward-amount u0) err-invalid-amount)

    ;; Get the post author
    (let ((post-author (unwrap! (map-get? posts post-id) err-invalid-amount)))
      ;; Check if rewarder has sufficient tokens
      (asserts! (>= (ft-get-balance forum-token tx-sender) reward-amount)
        err-invalid-amount
      )

      ;; Transfer tokens to post author
      (try! (ft-transfer? forum-token reward-amount tx-sender post-author))

      (ok true)
    )
  )
)

;; Read-only functions for data access
(define-read-only (get-post-author (post-id uint))
  (ok (map-get? posts post-id))
)

(define-read-only (get-post-content (post-id uint))
  (ok (map-get? post-content post-id))
)

(define-read-only (get-total-posts)
  (ok (var-get total-posts))
)

;; Token info functions
(define-read-only (get-token-name)
  (ok (var-get token-name))
)

(define-read-only (get-token-symbol)
  (ok (var-get token-symbol))
)

(define-read-only (get-token-decimals)
  (ok (var-get token-decimals))
)

(define-read-only (get-total-supply)
  (ok (var-get total-supply))
)

;; Get user balance
(define-read-only (get-balance (account principal))
  (ok (ft-get-balance forum-token account))
)
