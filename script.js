// ThinkBucks Forum Frontend JavaScript
import { connect, disconnect, isConnected, getLocalStorage, request } from '@stacks/connect';

class ThinkBucksForum {
    constructor() {
        this.currentUser = null;
        this.walletConnected = false;
        this.posts = [];
        this.init();
    }

    async init() {
        this.setupEventListeners();
        this.loadMockData();
        this.updateStats();
        this.setupSmoothScrolling();
        await this.checkAuthState();
    }

    // Check authentication state on load
    async checkAuthState() {
        if (await isConnected()) {
            this.walletConnected = true;
            this.loadUserFromStorage();
            this.updateUserInterface();
        } else {
            this.walletConnected = false;
            this.currentUser = null;
            this.updateUserInterface();
        }
    }

    // Connect and authenticate wallet
    async connectWallet() {
        if (await isConnected()) {
            this.showToast('Already authenticated', 'success');
            return;
        }
        this.showLoading('Connecting wallet...');
        try {
            const response = await connect();
            localStorage.setItem('stacksUserData', JSON.stringify(response));
            this.walletConnected = true;
            this.loadUserFromStorage();
            this.updateUserInterface();
            this.hideLoading();
            this.showToast('Wallet connected successfully!', 'success');
        } catch (error) {
            this.hideLoading();
            this.showToast('Wallet connection failed', 'error');
        }
    }

    // Logout and clear session
    async logout() {
        await disconnect();
        localStorage.removeItem('stacksUserData');
        this.walletConnected = false;
        this.currentUser = null;
        this.updateUserInterface();
        this.showToast('User disconnected', 'success');
    }

    // Load user data from localStorage
    loadUserFromStorage() {
        const userData = JSON.parse(localStorage.getItem('stacksUserData')) || getLocalStorage();
        if (userData?.addresses) {
            const stxAddress = userData.addresses.stx[0].address;
            this.currentUser = {
                address: stxAddress,
                name: userData.username || 'Stacks User',
                balance: 0, // You can fetch balance using @stacks/transactions if needed
                posts: 0,
                rewards: 0,
                reputation: 0
            };
        }
    }

    // Example: Get full account details
    async getAccountDetails() {
        const accounts = await request('stx_getAccounts');
        const account = accounts.addresses[0];
        console.log('Address:', account.address);
        console.log('Public key:', account.publicKey);
        console.log('Gaia URL:', account.gaiaHubUrl);
    }

    // Example: Send a transaction
    async sendTransaction() {
        const response = await request('stx_transferStx', {
            amount: '1000000', // 1 STX in micro-STX
            recipient: 'SP2MF04VAGYHGAZWGTEDW5VYCPDWWSY08Z1QFNDSN',
            memo: 'First transfer',
        });
        console.log('Transaction ID:', response.txid);
    }

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleNavigation(e.target.getAttribute('href').substring(1));
            });
        });

        // Wallet connection
        document.getElementById('connectWallet').addEventListener('click', () => {
            if (this.walletConnected) {
                this.logout();
            } else {
                this.connectWallet();
            }
        });

        // Create post modal
        document.getElementById('createPostBtn').addEventListener('click', () => {
            this.showCreatePostModal();
        });

        document.getElementById('closeModal').addEventListener('click', () => {
            this.hideCreatePostModal();
        });

        document.getElementById('cancelPost').addEventListener('click', () => {
            this.hideCreatePostModal();
        });

        document.getElementById('submitPost').addEventListener('click', () => {
            this.submitPost();
        });

        // Forum filters
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.handleFilterChange(e.target);
            });
        });

        // Explore button
        document.getElementById('exploreBtn').addEventListener('click', () => {
            this.scrollToSection('forum');
        });

        // Close modal on outside click
        document.getElementById('createPostModal').addEventListener('click', (e) => {
            if (e.target.id === 'createPostModal') {
                this.hideCreatePostModal();
            }
        });
    }

    setupSmoothScrolling() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
    }

    handleNavigation(section) {
        // Update active nav link
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        document.querySelector(`[href="#${section}"]`).classList.add('active');

        // Scroll to section
        this.scrollToSection(section);
    }

    scrollToSection(section) {
        const targetSection = document.getElementById(section);
        if (targetSection) {
            targetSection.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    }

    showCreatePostModal() {
        if (!this.walletConnected) {
            this.showToast('Please connect your wallet first!', 'error');
            return;
        }
        document.getElementById('createPostModal').style.display = 'block';
        document.body.style.overflow = 'hidden';
    }

    hideCreatePostModal() {
        document.getElementById('createPostModal').style.display = 'none';
        document.body.style.overflow = 'auto';
        this.clearPostForm();
    }

    clearPostForm() {
        document.getElementById('postTitle').value = '';
        document.getElementById('postContent').value = '';
        document.getElementById('postCategory').value = 'general';
    }

    async submitPost() {
        const title = document.getElementById('postTitle').value.trim();
        const content = document.getElementById('postContent').value.trim();
        const category = document.getElementById('postCategory').value;

        if (!title || !content) {
            this.showToast('Please fill in all fields!', 'error');
            return;
        }

        if (!this.walletConnected) {
            this.showToast('Please connect your wallet first!', 'error');
            return;
        }

        this.showLoading('Creating post...');

        // Simulate blockchain transaction
        setTimeout(() => {
            const newPost = {
                id: this.posts.length + 1,
                title: title,
                content: content,
                category: category,
                author: this.currentUser.name,
                authorAddress: this.currentUser.address,
                timestamp: new Date().toISOString(),
                rewards: 0,
                isRewarded: false,
                likes: 0,
                comments: 0
            };

            this.posts.unshift(newPost);
            this.currentUser.posts++;
            this.updatePostsDisplay();
            this.updateStats();
            this.updateUserInterface();

            this.hideCreatePostModal();
            this.hideLoading();
            this.showToast('Post created successfully!', 'success');
        }, 3000);
    }

    loadMockData() {
        this.posts = [
            {
                id: 1,
                title: "The Future of Decentralized Forums",
                content: "As we move towards a more decentralized web, forums like ThinkBucks are paving the way for community-driven discussions that reward quality content. The token incentive model creates a sustainable ecosystem where valuable contributions are recognized and rewarded.",
                category: "technology",
                author: "CryptoEnthusiast",
                authorAddress: "ST1ABC123DEF456",
                timestamp: "2024-01-15T10:30:00Z",
                rewards: 150,
                isRewarded: true,
                likes: 25,
                comments: 8
            },
            {
                id: 2,
                title: "Building Strong Communities Through Token Incentives",
                content: "Token incentives have revolutionized how we think about online communities. By directly rewarding quality contributions, we create an environment where users are motivated to share valuable insights and engage meaningfully with others.",
                category: "community",
                author: "CommunityBuilder",
                authorAddress: "ST1XYZ789ABC123",
                timestamp: "2024-01-14T15:45:00Z",
                rewards: 200,
                isRewarded: true,
                likes: 32,
                comments: 12
            },
            {
                id: 3,
                title: "Best Practices for Quality Content Creation",
                content: "Creating quality content that deserves rewards requires thoughtful planning, research, and genuine value delivery. Here are some strategies that have worked well in token-incentivized communities.",
                category: "education",
                author: "ContentCreator",
                authorAddress: "ST1DEF456GHI789",
                timestamp: "2024-01-13T09:15:00Z",
                rewards: 0,
                isRewarded: false,
                likes: 18,
                comments: 5
            }
        ];

        this.updatePostsDisplay();
    }

    updatePostsDisplay() {
        const container = document.getElementById('postsContainer');
        container.innerHTML = '';

        this.posts.forEach(post => {
            const postElement = this.createPostElement(post);
            container.appendChild(postElement);
        });
    }

    createPostElement(post) {
        const postDiv = document.createElement('div');
        postDiv.className = 'post-card';
        postDiv.innerHTML = `
            <div class="post-header">
                <div class="post-author">
                    <div class="author-avatar">
                        ${post.author.charAt(0)}
                    </div>
                    <div>
                        <div style="font-weight: 600; color: #333;">${post.author}</div>
                        <div style="font-size: 0.9rem; color: #666;">
                            ${this.formatTimestamp(post.timestamp)} • ${post.category}
                        </div>
                    </div>
                </div>
                ${post.isRewarded ? '<span style="color: #f39c12; font-weight: 600;"><i class="fas fa-star"></i> Rewarded</span>' : ''}
            </div>
            <div class="post-title">${post.title}</div>
            <div class="post-content">${post.content}</div>
            <div class="post-actions">
                <div class="post-stats">
                    <span><i class="fas fa-heart"></i> ${post.likes}</span>
                    <span><i class="fas fa-comment"></i> ${post.comments}</span>
                    ${post.rewards > 0 ? `<span><i class="fas fa-coins"></i> ${post.rewards} FORUM</span>` : ''}
                </div>
                ${!post.isRewarded ? `
                    <button class="reward-btn" onclick="forum.rewardPost(${post.id})">
                        <i class="fas fa-gift"></i>
                        Reward
                    </button>
                ` : ''}
            </div>
        `;
        return postDiv;
    }

    async rewardPost(postId) {
        if (!this.walletConnected) {
            this.showToast('Please connect your wallet first!', 'error');
            return;
        }

        const post = this.posts.find(p => p.id === postId);
        if (!post) return;

        this.showLoading('Processing reward...');

        // Simulate blockchain transaction
        setTimeout(() => {
            post.rewards += 50;
            post.isRewarded = true;
            this.currentUser.balance -= 50;

            this.updatePostsDisplay();
            this.updateUserInterface();
            this.hideLoading();
            this.showToast(`Rewarded ${post.author} with 50 FORUM tokens!`, 'success');
        }, 2000);
    }

    handleFilterChange(button) {
        // Update active filter button
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        button.classList.add('active');

        // Apply filter (in a real app, this would filter the posts)
        const filter = button.getAttribute('data-filter');
        console.log(`Filtering by: ${filter}`);
    }

    loadUserPosts() {
        const container = document.getElementById('userPostsContainer');
        if (!this.walletConnected) {
            container.innerHTML = '<p style="text-align: center; color: #666;">Connect your wallet to see your posts</p>';
            return;
        }

        const userPosts = this.posts.filter(post => post.authorAddress === this.currentUser.address);

        if (userPosts.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #666;">No posts yet. Create your first post!</p>';
            return;
        }

        container.innerHTML = userPosts.map(post => `
            <div class="post-card" style="margin-bottom: 20px;">
                <div class="post-title">${post.title}</div>
                <div class="post-content">${post.content.substring(0, 100)}...</div>
                <div class="post-stats">
                    <span><i class="fas fa-heart"></i> ${post.likes}</span>
                    <span><i class="fas fa-comment"></i> ${post.comments}</span>
                    ${post.rewards > 0 ? `<span><i class="fas fa-coins"></i> ${post.rewards} FORUM</span>` : ''}
                </div>
            </div>
        `).join('');
    }

    updateStats() {
        document.getElementById('totalPosts').textContent = this.posts.length;
        document.getElementById('totalRewards').textContent = this.posts.reduce((sum, post) => sum + post.rewards, 0);
        document.getElementById('activeUsers').textContent = new Set(this.posts.map(post => post.authorAddress)).size;
    }

    formatTimestamp(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
        
        if (diffInHours < 1) return 'Just now';
        if (diffInHours < 24) return `${diffInHours}h ago`;
        if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
        return date.toLocaleDateString();
    }

    showLoading(message = 'Processing...') {
        const overlay = document.getElementById('loadingOverlay');
        overlay.querySelector('p').textContent = message;
        overlay.style.display = 'flex';
    }

    hideLoading() {
        document.getElementById('loadingOverlay').style.display = 'none';
    }

    showToast(message, type = 'success') {
        const toast = document.getElementById('toast');
        const icon = toast.querySelector('.toast-icon');
        const messageEl = toast.querySelector('.toast-message');

        // Set icon based on type
        if (type === 'success') {
            icon.className = 'fas fa-check-circle';
        } else if (type === 'error') {
            icon.className = 'fas fa-exclamation-circle';
        }

        messageEl.textContent = message;
        toast.className = `toast ${type}`;
        toast.classList.add('show');

        // Hide after 3 seconds
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }
}

// Initialize the forum when DOM is loaded
// (window.forum is used for rewardPost button inline handler)
document.addEventListener('DOMContentLoaded', () => {
    window.forum = new ThinkBucksForum();
});

// Add some nice animations on scroll
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

document.addEventListener('DOMContentLoaded', () => {
    const animatedElements = document.querySelectorAll('.post-card, .reward-card, .stat-card');
    animatedElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
}); 