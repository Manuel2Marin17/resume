// Master's Projects Data
const mastersProjects = [
    {
        id: 'credit-card-fraud',
        title: 'Credit Card Fraud Detection System',
        course: 'CSC-722: Machine Learning Fundamentals',
        summary: 'Built a comprehensive fraud detection system analyzing 1.3 million credit card transactions to identify fraudulent patterns using advanced machine learning techniques.',
        whatIDid: [
            'Analyzed 1.3 million transaction records to understand fraud patterns',
            'Engineered time-based features including transaction hour, day of week, and spending velocity',
            'Created spending pattern indicators and age-based demographic features',
            'Implemented and compared multiple classification algorithms (Random Forest, SVM, Logistic Regression)',
            'Developed interactive visualizations for fraud pattern analysis using Matplotlib and Seaborn'
        ],
        highlights: [
            'Achieved high accuracy in fraud detection through ensemble methods',
            'Reduced false positives by engineering domain-specific features',
            'Created real-time visualization dashboards for fraud monitoring',
            'Handled highly imbalanced dataset (less than 1% fraud cases)'
        ],
        whyIDidIt: 'Financial fraud costs billions annually. This project aimed to develop a practical system that could detect fraudulent transactions in real-time while minimizing false positives that inconvenience legitimate customers.',
        whatILearned: [
            'Handling imbalanced datasets using SMOTE and class weighting',
            'Feature engineering for time-series transaction data',
            'Model evaluation metrics beyond accuracy (precision, recall, F1-score)',
            'Building production-ready ML pipelines with scikit-learn'
        ],
        technologies: ['Python', 'scikit-learn', 'pandas', 'NumPy', 'Matplotlib', 'Seaborn', 'Jupyter Notebooks'],
        codeExample: `# Feature Engineering for Transaction Patterns
cc['trans_date_trans_time'] = pd.to_datetime(cc['trans_date_trans_time'])
cc['transaction_hour'] = cc['trans_date_trans_time'].dt.hour
cc['transaction_day'] = cc['trans_date_trans_time'].dt.dayofweek
cc['is_weekend'] = cc['transaction_day'].isin([5, 6])

# Calculate spending velocity
cc['spending_velocity'] = cc.groupby('cc_num')['amt'].rolling('24H').sum()

# Age-based risk scoring
bins = [18, 25, 35, 45, 55, 65, 75, 85, 95, 105]
labels = ['18-25', '26-35', '36-45', '46-55', '56-65', '66-75', '76-85', '86-95', '96-105']
cc['age_group'] = pd.cut(cc['age'], bins=bins, labels=labels, right=False)`
    },
    {
        id: 'deep-rl',
        title: 'Deep Reinforcement Learning Implementations',
        course: 'CSC-479: Reinforcement Learning',
        summary: 'Developed multiple state-of-the-art reinforcement learning agents to solve complex control problems in simulated environments, from classic control to Atari games.',
        whatIDid: [
            'Implemented Double DQN agent for CartPole achieving 500+ timestep performance',
            'Trained PPO algorithm for continuous control in LunarLander (10M training steps)',
            'Built DQN agent for Atari PacMan with custom reward engineering',
            'Created A2C controller for Panda robotic arm pick-and-place tasks',
            'Optimized hyperparameters for each environment using systematic experimentation'
        ],
        highlights: [
            'CartPole: Achieved perfect balance (500 steps) in under 100 episodes',
            'LunarLander: Successfully landed with 95%+ success rate',
            'PacMan: Improved baseline score by 3x through reward shaping',
            'Implemented experience replay and target networks from scratch'
        ],
        whyIDidIt: 'Reinforcement learning represents the cutting edge of AI for autonomous decision-making. This project provided hands-on experience with algorithms that power everything from game AI to robotics and autonomous vehicles.',
        whatILearned: [
            'Deep understanding of value-based (DQN) vs policy-based (PPO, A2C) methods',
            'Importance of exploration strategies (ε-greedy, entropy regularization)',
            'Debugging RL algorithms through reward curves and Q-value analysis',
            'GPU-accelerated training with PyTorch and Stable-Baselines3'
        ],
        technologies: ['Python', 'PyTorch', 'Stable-Baselines3', 'OpenAI Gym', 'TensorFlow', 'NumPy'],
        codeExample: `class DoubleDQNAgent:
    def __init__(self, state_size, action_size):
        self.memory = deque(maxlen=10000)
        self.epsilon = 1.0  # exploration rate
        self.model = self._build_model()
        self.target_model = self._build_model()
        
    def _build_model(self):
        model = Sequential([
            Dense(24, activation='relu', input_shape=(self.state_size,)),
            Dense(24, activation='relu'),
            Dense(self.action_size, activation='linear')
        ])
        model.compile(loss='mse', optimizer=Adam(lr=0.001))
        return model
        
    def act(self, state):
        if np.random.rand() <= self.epsilon:
            return random.randrange(self.action_size)
        act_values = self.model.predict(state)
        return np.argmax(act_values[0])
        
    def replay(self, batch_size):
        # Double DQN update
        targets = self.model.predict(states)
        next_actions = np.argmax(self.model.predict(next_states), axis=1)
        next_q_values = self.target_model.predict(next_states)
        
        for i in range(batch_size):
            if dones[i]:
                targets[i][actions[i]] = rewards[i]
            else:
                targets[i][actions[i]] = rewards[i] + self.gamma * next_q_values[i][next_actions[i]]`
    },
    {
        id: 'llm-finetuning',
        title: 'LLM Fine-Tuning with LoRA',
        course: 'INFS-778: Deep Learning',
        summary: 'Fine-tuned DeepSeek-R1 Distilled Llama-8B model using parameter-efficient LoRA technique on 52K instruction-following examples, achieving task-specific improvements while maintaining general capabilities.',
        whatIDid: [
            'Loaded and configured DeepSeek-R1 8B model with 4-bit quantization',
            'Implemented LoRA (Low-Rank Adaptation) with r=4 for memory-efficient training',
            'Processed Alpaca-GPT4 dataset (52K examples) into conversational format',
            'Fine-tuned model on instruction-following tasks using Unsloth framework',
            'Deployed model locally using Ollama for production inference'
        ],
        highlights: [
            'Reduced memory usage by 90% through LoRA and quantization',
            'Achieved improved instruction-following while preserving base capabilities',
            'Successfully deployed 8B parameter model on consumer GPU',
            'Created custom Modelfile for Ollama deployment'
        ],
        whyIDidIt: 'Large Language Models are transforming software development, but using them effectively requires understanding fine-tuning techniques. This project provided practical experience in adapting state-of-the-art models for specific tasks.',
        whatILearned: [
            'Parameter-efficient fine-tuning techniques (LoRA, QLoRA)',
            'Handling large-scale models with limited compute resources',
            'Dataset preparation for instruction tuning',
            'Local deployment strategies for LLMs',
            'Trade-offs between model size, performance, and inference speed'
        ],
        technologies: ['Python', 'Unsloth', 'Hugging Face Transformers', 'PyTorch', 'Ollama', 'CUDA'],
        codeExample: `# Configure LoRA for parameter-efficient fine-tuning
model = FastLanguageModel.get_peft_model(
    model,
    r = 4,  # LoRA rank
    target_modules = ["q_proj", "k_proj", "v_proj", "o_proj"],
    lora_alpha = 16,
    lora_dropout = 0,
    bias = "none",
    use_gradient_checkpointing = "unsloth",
)

# Prepare dataset in conversational format
dataset = apply_chat_template(
    dataset,
    tokenizer = tokenizer,
    chat_template = """Below are some instructions that describe some tasks. 
    Write responses that appropriately complete each request.
    
    ### Instruction:
    {INPUT}
    
    ### Response:
    {OUTPUT}"""
)

# Train with memory-efficient settings
trainer = SFTTrainer(
    model = model,
    train_dataset = dataset,
    args = TrainingArguments(
        per_device_train_batch_size = 1,
        gradient_accumulation_steps = 2,
        learning_rate = 2e-4,
        fp16 = True,
        optim = "adamw_8bit",
    ),
)`
    },
    {
        id: 'ai-game-agents',
        title: 'AI Game Playing Agents',
        course: 'CSC-447: Artificial Intelligence',
        summary: 'Developed intelligent game-playing agents using classical AI algorithms including minimax with alpha-beta pruning for perfect play in adversarial games.',
        whatIDid: [
            'Implemented unbeatable Tic-Tac-Toe AI using minimax algorithm',
            'Added alpha-beta pruning for 40% performance improvement',
            'Created heuristic evaluation functions for game state analysis',
            'Built interactive Python GUI for human vs AI gameplay',
            'Extended implementation to support variable board sizes'
        ],
        highlights: [
            'Achieved perfect play - AI never loses',
            'Optimized search to handle 9! possible game states efficiently',
            'Demonstrated exponential speedup with alpha-beta pruning',
            'Clean separation of game logic and AI strategy'
        ],
        whyIDidIt: 'Game AI provides a perfect testbed for adversarial search algorithms. Understanding minimax and alpha-beta pruning is fundamental to many AI applications beyond games, including decision-making under uncertainty.',
        whatILearned: [
            'Adversarial search algorithms and game tree exploration',
            'Importance of move ordering for pruning effectiveness',
            'Time-space tradeoffs in AI algorithm design',
            'Implementing efficient recursive algorithms in Python'
        ],
        technologies: ['Python', 'Tkinter', 'NumPy'],
        codeExample: `def minimax(board, depth, is_maximizing, alpha, beta):
    # Check terminal states
    winner = check_winner(board)
    if winner == 'X':
        return 1
    elif winner == 'O':
        return -1
    elif is_board_full(board):
        return 0
    
    if is_maximizing:
        max_eval = -float('inf')
        for move in get_available_moves(board):
            board[move] = 'X'
            eval = minimax(board, depth + 1, False, alpha, beta)
            board[move] = ' '  # Undo move
            max_eval = max(max_eval, eval)
            alpha = max(alpha, eval)
            if beta <= alpha:
                break  # Alpha-beta pruning
        return max_eval
    else:
        min_eval = float('inf')
        for move in get_available_moves(board):
            board[move] = 'O'
            eval = minimax(board, depth + 1, True, alpha, beta)
            board[move] = ' '
            min_eval = min(min_eval, eval)
            beta = min(beta, eval)
            if beta <= alpha:
                break
        return min_eval`
    },
    {
        id: 'bayesian-networks',
        title: 'Probabilistic Reasoning with Bayesian Networks',
        course: 'CSC-447: Artificial Intelligence',
        summary: 'Built Bayesian Networks for uncertainty reasoning and implemented inference algorithms for real-world probabilistic problems.',
        whatIDid: [
            'Constructed Bayesian Networks for classic problems (Burglary Alarm, Medical Diagnosis)',
            'Implemented exact inference using variable elimination',
            'Developed conditional probability calculations for complex queries',
            'Created decision trees with information gain for classification',
            'Built Prolog-based expert systems for logical reasoning'
        ],
        highlights: [
            'Successfully modeled uncertainty in real-world scenarios',
            'Implemented both exact and approximate inference methods',
            'Integrated probabilistic and logical reasoning approaches',
            'Achieved 90%+ accuracy on diagnostic tasks'
        ],
        whyIDidIt: 'Most real-world AI applications involve uncertainty. Bayesian Networks provide a principled framework for reasoning under uncertainty, crucial for applications like medical diagnosis, risk assessment, and decision support systems.',
        whatILearned: [
            'Probabilistic graphical models and independence assumptions',
            'Computational complexity of exact vs approximate inference',
            'Combining domain knowledge with data-driven approaches',
            'Trade-offs between model complexity and interpretability'
        ],
        technologies: ['Python', 'NumPy', 'pgmpy', 'Prolog', 'Jupyter Notebooks'],
        codeExample: `# Define Burglary Alarm Bayesian Network
from pgmpy.models import BayesianNetwork
from pgmpy.factors.discrete import TabularCPD

# Define structure
model = BayesianNetwork([
    ('Burglary', 'Alarm'),
    ('Earthquake', 'Alarm'),
    ('Alarm', 'JohnCalls'),
    ('Alarm', 'MaryCalls')
])

# Define CPDs (Conditional Probability Distributions)
cpd_burglary = TabularCPD('Burglary', 2, [[0.999], [0.001]])
cpd_earthquake = TabularCPD('Earthquake', 2, [[0.998], [0.002]])

cpd_alarm = TabularCPD('Alarm', 2,
    [[0.999, 0.71, 0.06, 0.05],  # P(Alarm=False|B,E)
     [0.001, 0.29, 0.94, 0.95]], # P(Alarm=True|B,E)
    evidence=['Burglary', 'Earthquake'],
    evidence_card=[2, 2])

# Add CPDs to model
model.add_cpds(cpd_burglary, cpd_earthquake, cpd_alarm, cpd_john, cpd_mary)

# Perform inference
from pgmpy.inference import VariableElimination
inference = VariableElimination(model)
result = inference.query(['Burglary'], evidence={'JohnCalls': 1, 'MaryCalls': 1})`
    },
    {
        id: 'hybrid-filesystem',
        title: 'Hybrid File System Implementation',
        course: 'CSC-712: Operating Systems',
        summary: 'Designed and implemented a custom file system from scratch combining B-tree indexing for directories with bitmap allocation for efficient space management.',
        whatIDid: [
            'Designed hybrid architecture combining B-trees and bitmaps',
            'Implemented core file operations (create, read, write, delete)',
            'Built hierarchical directory structure with path resolution',
            'Created block allocation system with fragmentation handling',
            'Developed comprehensive testing framework in C#'
        ],
        highlights: [
            'Achieved O(log n) directory lookups with B-tree indexing',
            'Implemented efficient space allocation with bitmap tracking',
            'Supported files up to 4GB with indirect block pointers',
            'Created modular design allowing easy feature extensions'
        ],
        whyIDidIt: 'Understanding file systems at a low level is crucial for system programming. This project provided deep insights into how operating systems manage persistent storage and the trade-offs in file system design.',
        whatILearned: [
            'Low-level disk I/O and block management strategies',
            'B-tree implementation for efficient indexing',
            'Trade-offs between performance and storage efficiency',
            'Importance of atomic operations for consistency',
            'System programming patterns in C#'
        ],
        technologies: ['C#', '.NET Core', 'Binary I/O', 'B-Trees', 'Bitmap Algorithms'],
        codeExample: `public class DirectoryBTree
{
    private BTreeNode root;
    private readonly int degree;
    
    public void Insert(string filename, uint inodeNumber)
    {
        if (root.IsFull)
        {
            var newRoot = new BTreeNode(degree, false);
            newRoot.Children[0] = root;
            SplitChild(newRoot, 0);
            root = newRoot;
        }
        InsertNonFull(root, filename, inodeNumber);
    }
    
    private void SplitChild(BTreeNode parent, int index)
    {
        var fullChild = parent.Children[index];
        var newChild = new BTreeNode(degree, fullChild.IsLeaf);
        
        // Move half the keys to new node
        for (int j = 0; j < degree - 1; j++)
        {
            newChild.Keys[j] = fullChild.Keys[j + degree];
            newChild.Values[j] = fullChild.Values[j + degree];
        }
        
        // Update parent
        parent.Keys[index] = fullChild.Keys[degree - 1];
        parent.Children[index + 1] = newChild;
        
        fullChild.KeyCount = degree - 1;
        newChild.KeyCount = degree - 1;
    }
}`
    }
];

// Function to render project details
function renderProjectDetails(projectId) {
    const project = mastersProjects.find(p => p.id === projectId);
    if (!project) return '';
    
    return `
        <div class="project-detail">
            <h3>${project.title}</h3>
            <p class="project-course"><i class="fas fa-graduation-cap"></i> ${project.course}</p>
            
            <div class="project-section">
                <h4>Summary</h4>
                <p>${project.summary}</p>
            </div>
            
            <div class="project-section">
                <h4>What I Did</h4>
                <ul>
                    ${project.whatIDid.map(item => `<li>${item}</li>`).join('')}
                </ul>
            </div>
            
            <div class="project-section">
                <h4>Key Highlights</h4>
                <ul>
                    ${project.highlights.map(item => `<li>${item}</li>`).join('')}
                </ul>
            </div>
            
            <div class="project-section">
                <h4>Why I Did It</h4>
                <p>${project.whyIDidIt}</p>
            </div>
            
            <div class="project-section">
                <h4>What I Learned</h4>
                <ul>
                    ${project.whatILearned.map(item => `<li>${item}</li>`).join('')}
                </ul>
            </div>
            
            <div class="project-section">
                <h4>Technologies Used</h4>
                <div class="tech-tags">
                    ${project.technologies.map(tech => `<span class="tech-tag">${tech}</span>`).join('')}
                </div>
            </div>
            
            <div class="project-section">
                <h4>Code Example</h4>
                <pre><code class="language-python">${project.codeExample}</code></pre>
            </div>
        </div>
    `;
}

// Initialize project cards
document.addEventListener('DOMContentLoaded', function() {
    // Check if we're on a page with the masters projects section
    const projectsContainer = document.getElementById('masters-projects-container');
    if (projectsContainer) {
        renderMastersProjects();
    }
});

function renderMastersProjects() {
    const container = document.getElementById('masters-projects-container');
    if (!container) return;
    
    const projectsHTML = mastersProjects.map(project => `
        <div class="masters-project-card" onclick="showProjectDetails('${project.id}')">
            <h3>${project.title}</h3>
            <p class="project-course">${project.course}</p>
            <p class="project-summary">${project.summary}</p>
            <div class="project-tech-preview">
                ${project.technologies.slice(0, 3).map(tech => `<span class="tech-tag-small">${tech}</span>`).join('')}
                ${project.technologies.length > 3 ? `<span class="tech-tag-small">+${project.technologies.length - 3} more</span>` : ''}
            </div>
            <button class="btn-view-details">View Details <i class="fas fa-arrow-right"></i></button>
        </div>
    `).join('');
    
    container.innerHTML = projectsHTML;
}

function showProjectDetails(projectId) {
    const modal = document.createElement('div');
    modal.className = 'project-modal';
    modal.innerHTML = `
        <div class="project-modal-content">
            <button class="modal-close" onclick="closeProjectModal()">
                <i class="fas fa-times"></i>
            </button>
            ${renderProjectDetails(projectId)}
        </div>
    `;
    document.body.appendChild(modal);
    
    // Add click outside to close
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeProjectModal();
        }
    });
    
    // Trigger syntax highlighting if available
    if (typeof Prism !== 'undefined') {
        Prism.highlightAll();
    }
}

function closeProjectModal() {
    const modal = document.querySelector('.project-modal');
    if (modal) {
        modal.remove();
    }
}