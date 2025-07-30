// Study App JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const modeCards = document.querySelectorAll('.mode-card');
    const flashcardsSection = document.getElementById('flashcards-section');
    const quizSection = document.getElementById('quiz-section');
    const referenceSection = document.getElementById('reference-section');
    const codingSection = document.getElementById('coding-section');
    const studyModes = document.querySelector('.study-modes');

    // Flashcard elements
    const flashcard = document.getElementById('flashcard');
    const categorySelect = document.getElementById('flashcard-category');
    const shuffleBtn = document.getElementById('shuffle-cards');
    const prevBtn = document.getElementById('prev-card');
    const nextBtn = document.getElementById('next-card');
    const currentCardSpan = document.getElementById('current-card');
    const totalCardsSpan = document.getElementById('total-cards');
    const progressFill = document.getElementById('progress-fill');

    // Quiz elements
    const quizSetup = document.getElementById('quiz-setup');
    const quizContent = document.getElementById('quiz-content');
    const quizResults = document.getElementById('quiz-results');
    const startQuizBtn = document.getElementById('start-quiz');
    const submitAnswerBtn = document.getElementById('submit-answer');
    const nextQuestionBtn = document.getElementById('next-question');
    const restartQuizBtn = document.getElementById('restart-quiz');

    // Back buttons
    const backButtons = document.querySelectorAll('[id^="back-to-modes"]');

    // Coding challenge elements
    const submitCodeAnswerBtn = document.getElementById('submit-code-answer');
    const nextChallengeBtn = document.getElementById('next-challenge');
    const restartCodingBtn = document.getElementById('restart-coding');
    const codingContent = document.getElementById('coding-content');
    const codingComplete = document.getElementById('coding-complete');

    // State
    let currentFlashcards = [];
    let currentCardIndex = 0;
    let quizQuestions = [];
    let currentQuizIndex = 0;
    let quizScore = 0;
    let quizStartTime = null;
    let selectedAnswer = null;
    
    // Coding challenge state
    let codingChallengesList = [];
    let currentChallengeIndex = 0;
    let codingScore = 0;
    let selectedCodeAnswer = null;

    // Code expansion modal elements
    const codeModal = document.getElementById('code-modal');
    const codeModalClose = document.querySelector('.code-modal-close');
    const expandedCode = document.getElementById('expanded-code');
    const copyCodeBtn = document.querySelector('.copy-code-btn');

    // Practice mode elements
    const practiceOverlay = document.getElementById('practice-overlay');
    const practiceClose = document.querySelector('.practice-close');
    const practiceOptionsContainer = document.getElementById('practice-options');
    const practiceFeedback = document.getElementById('practice-feedback');
    const practiceContinueBtn = document.getElementById('practice-continue');
    let currentPracticeCard = null;
    let selectedPracticeAnswer = null;

    // Initialize
    initializeApp();

    function initializeApp() {
        // Mode selection
        modeCards.forEach(card => {
            card.addEventListener('click', function(e) {
                // Handle clicks on the card or its button
                const mode = this.dataset.mode;
                showMode(mode);
            });
            
            // Also handle button clicks specifically
            const button = card.querySelector('button');
            if (button) {
                button.addEventListener('click', function(e) {
                    e.stopPropagation(); // Prevent double trigger
                    const mode = card.dataset.mode;
                    showMode(mode);
                });
            }
        });

        // Back buttons
        backButtons.forEach(btn => {
            btn.addEventListener('click', showModeSelection);
        });

        // Flashcard controls
        flashcard.addEventListener('click', flipCard);
        categorySelect.addEventListener('change', loadFlashcards);
        shuffleBtn.addEventListener('click', shuffleFlashcards);
        prevBtn.addEventListener('click', showPreviousCard);
        nextBtn.addEventListener('click', showNextCard);

        // Quiz controls
        startQuizBtn.addEventListener('click', startQuiz);
        submitAnswerBtn.addEventListener('click', submitAnswer);
        nextQuestionBtn.addEventListener('click', nextQuestion);
        restartQuizBtn.addEventListener('click', () => {
            showModeSelection();
            resetQuiz();
        });
        
        // Coding challenge controls
        submitCodeAnswerBtn.addEventListener('click', submitCodeAnswer);
        nextChallengeBtn.addEventListener('click', nextCodingChallenge);
        restartCodingBtn.addEventListener('click', () => {
            showModeSelection();
            resetCodingChallenges();
        });

        // Reference search
        const searchInput = document.getElementById('search-reference');
        if (searchInput) {
            searchInput.addEventListener('input', filterReference);
        }

        // Reference filters
        const filterBtns = document.querySelectorAll('.filter-btn');
        filterBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                filterBtns.forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                filterReferenceByCategory(this.dataset.filter);
            });
        });

        // Keyboard navigation for flashcards
        document.addEventListener('keydown', function(e) {
            if (flashcardsSection && !flashcardsSection.classList.contains('hidden')) {
                if (e.key === 'ArrowLeft') showPreviousCard();
                if (e.key === 'ArrowRight') showNextCard();
                if (e.key === ' ') {
                    e.preventDefault();
                    flipCard();
                }
            }
        });

        // Code expansion modal event listeners
        if (codeModalClose) {
            codeModalClose.addEventListener('click', closeCodeModal);
        }

        if (copyCodeBtn) {
            copyCodeBtn.addEventListener('click', copyExpandedCode);
        }

        // Close modal when clicking outside
        window.addEventListener('click', function(e) {
            if (e.target === codeModal) {
                closeCodeModal();
            }
        });

        // ESC key to close modal
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && codeModal && codeModal.style.display === 'block') {
                closeCodeModal();
            }
        });

        // Practice mode event listeners
        if (practiceClose) {
            practiceClose.addEventListener('click', closePracticeMode);
        }

        if (practiceContinueBtn) {
            practiceContinueBtn.addEventListener('click', closePracticeMode);
        }

        // Close practice overlay when clicking outside
        if (practiceOverlay) {
            practiceOverlay.addEventListener('click', function(e) {
                if (e.target === practiceOverlay) {
                    closePracticeMode();
                }
            });
        }
    }

    function showMode(mode) {
        // Hide all sections
        studyModes.classList.add('hidden');
        flashcardsSection.classList.add('hidden');
        quizSection.classList.add('hidden');
        referenceSection.classList.add('hidden');
        codingSection.classList.add('hidden');

        // Show selected mode
        switch(mode) {
            case 'flashcards':
                flashcardsSection.classList.remove('hidden');
                loadFlashcards();
                break;
            case 'quiz':
                quizSection.classList.remove('hidden');
                resetQuiz();
                break;
            case 'reference':
                referenceSection.classList.remove('hidden');
                loadReference();
                break;
            case 'coding':
                codingSection.classList.remove('hidden');
                startCodingChallenges();
                break;
        }
    }

    function showModeSelection() {
        studyModes.classList.remove('hidden');
        flashcardsSection.classList.add('hidden');
        quizSection.classList.add('hidden');
        referenceSection.classList.add('hidden');
        codingSection.classList.add('hidden');
    }

    // Flashcard Functions
    function loadFlashcards() {
        const category = categorySelect.value;
        currentFlashcards = [];
        currentCardIndex = 0;

        if (category === 'all') {
            for (const cat in interviewData) {
                currentFlashcards = currentFlashcards.concat(
                    interviewData[cat].map(q => ({ ...q, category: cat }))
                );
            }
        } else {
            currentFlashcards = interviewData[category].map(q => ({ ...q, category }));
        }

        totalCardsSpan.textContent = currentFlashcards.length;
        showCard(0);
    }

    function showCard(index) {
        if (currentFlashcards.length === 0) return;

        const card = currentFlashcards[index];
        const front = flashcard.querySelector('.flashcard-front');
        const back = flashcard.querySelector('.flashcard-back');

        front.querySelector('.card-category').textContent = getCategoryName(card.category);
        front.querySelector('.card-question').textContent = card.question;
        back.querySelector('.card-category').textContent = getCategoryName(card.category);
        
        // Handle answer and code examples
        const answerDiv = back.querySelector('.card-answer');
        answerDiv.innerHTML = ''; // Clear existing content
        
        // Add the main answer
        const answerText = document.createElement('div');
        answerText.className = 'answer-text';
        answerText.textContent = card.answer;
        answerDiv.appendChild(answerText);
        
        // Add practice button
        const practiceBtn = document.createElement('button');
        practiceBtn.className = 'practice-btn';
        practiceBtn.innerHTML = '<i class="fas fa-brain"></i> Practice This Question';
        practiceBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            showPracticeMode(card, index);
        });
        answerDiv.appendChild(practiceBtn);
        
        // Add code example if available
        if (card.code) {
            const codeSection = document.createElement('div');
            codeSection.className = 'code-section';
            
            const codeButton = document.createElement('button');
            codeButton.className = 'code-toggle';
            codeButton.innerHTML = '<i class="fas fa-code"></i> View Code Example';
            codeButton.addEventListener('click', function(e) {
                e.stopPropagation(); // Prevent card flip
                openCodeModal(card.code, card.question);
            });
            
            codeSection.appendChild(codeButton);
            answerDiv.appendChild(codeSection);
        }

        currentCardSpan.textContent = index + 1;
        updateProgress();
        updateNavigationButtons();

        // Reset flip state
        flashcard.classList.remove('flipped');
    }

    function flipCard() {
        flashcard.classList.toggle('flipped');
    }

    function showPreviousCard() {
        if (currentCardIndex > 0) {
            currentCardIndex--;
            showCard(currentCardIndex);
        }
    }

    function showNextCard() {
        if (currentCardIndex < currentFlashcards.length - 1) {
            currentCardIndex++;
            showCard(currentCardIndex);
        }
    }

    function shuffleFlashcards() {
        for (let i = currentFlashcards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [currentFlashcards[i], currentFlashcards[j]] = [currentFlashcards[j], currentFlashcards[i]];
        }
        currentCardIndex = 0;
        showCard(0);
    }

    function updateProgress() {
        const progress = ((currentCardIndex + 1) / currentFlashcards.length) * 100;
        progressFill.style.width = progress + '%';
    }

    function updateNavigationButtons() {
        prevBtn.disabled = currentCardIndex === 0;
        nextBtn.disabled = currentCardIndex === currentFlashcards.length - 1;
    }

    // Quiz Functions
    function resetQuiz() {
        quizSetup.classList.remove('hidden');
        quizContent.classList.add('hidden');
        quizResults.classList.add('hidden');
        quizScore = 0;
        currentQuizIndex = 0;
        selectedAnswer = null;
    }

    function startQuiz() {
        const numQuestions = parseInt(document.getElementById('quiz-length').value);
        const category = document.getElementById('quiz-category').value;

        // Prepare questions
        quizQuestions = [];
        const sourceQuestions = [];

        if (category === 'all') {
            for (const cat in interviewData) {
                sourceQuestions.push(...interviewData[cat].map(q => ({ ...q, category: cat })));
            }
        } else {
            sourceQuestions.push(...interviewData[category].map(q => ({ ...q, category })));
        }

        // Shuffle and select questions
        const shuffled = sourceQuestions.sort(() => Math.random() - 0.5);
        quizQuestions = shuffled.slice(0, Math.min(numQuestions, shuffled.length));

        // Generate wrong answers for each question
        quizQuestions = quizQuestions.map(q => {
            const wrongAnswers = generateWrongAnswers(q, sourceQuestions);
            return { ...q, options: shuffleArray([q.answer, ...wrongAnswers]) };
        });

        // Start quiz
        quizSetup.classList.add('hidden');
        quizContent.classList.remove('hidden');
        quizStartTime = Date.now();
        document.getElementById('quiz-total').textContent = quizQuestions.length;
        showQuizQuestion(0);
    }

    function generateWrongAnswers(correctQuestion, allQuestions) {
        const wrongAnswers = allQuestions
            .filter(q => q.question !== correctQuestion.question && q.category === correctQuestion.category)
            .map(q => q.answer)
            .sort(() => Math.random() - 0.5)
            .slice(0, 3);

        // If not enough wrong answers from same category, get from other categories
        if (wrongAnswers.length < 3) {
            const otherAnswers = allQuestions
                .filter(q => q.question !== correctQuestion.question && !wrongAnswers.includes(q.answer))
                .map(q => q.answer)
                .sort(() => Math.random() - 0.5)
                .slice(0, 3 - wrongAnswers.length);
            wrongAnswers.push(...otherAnswers);
        }

        return wrongAnswers;
    }

    function showQuizQuestion(index) {
        const question = quizQuestions[index];
        document.getElementById('current-question').textContent = index + 1;
        document.getElementById('total-questions').textContent = quizQuestions.length;

        const questionCard = document.querySelector('.question-card');
        questionCard.querySelector('.question-category').textContent = getCategoryName(question.category);
        questionCard.querySelector('.question-text').textContent = question.question;

        const optionsContainer = document.getElementById('answer-options');
        optionsContainer.innerHTML = '';

        question.options.forEach((option, i) => {
            const optionDiv = document.createElement('div');
            optionDiv.className = 'answer-option';
            optionDiv.innerHTML = `
                <input type="radio" name="answer" id="option${i}" value="${i}">
                <label for="option${i}" class="answer-text">${option}</label>
            `;
            optionDiv.addEventListener('click', function() {
                const radio = this.querySelector('input[type="radio"]');
                radio.checked = true;
                selectQuizAnswer(i);
            });
            optionsContainer.appendChild(optionDiv);
        });

        // Reset state
        selectedAnswer = null;
        submitAnswerBtn.disabled = true;
        submitAnswerBtn.classList.remove('hidden');
        nextQuestionBtn.classList.add('hidden');
    }

    function selectQuizAnswer(index) {
        selectedAnswer = index;
        submitAnswerBtn.disabled = false;

        // Update visual state
        document.querySelectorAll('.answer-option').forEach(opt => {
            opt.classList.remove('selected');
        });
        document.querySelectorAll('.answer-option')[index].classList.add('selected');
    }

    function submitAnswer() {
        const question = quizQuestions[currentQuizIndex];
        const correct = question.options[selectedAnswer] === question.answer;

        if (correct) {
            quizScore++;
            document.getElementById('quiz-score').textContent = quizScore;
        }

        // Show correct/incorrect
        document.querySelectorAll('.answer-option').forEach((opt, i) => {
            if (question.options[i] === question.answer) {
                opt.classList.add('correct');
            } else if (i === selectedAnswer && !correct) {
                opt.classList.add('incorrect');
            }
            opt.style.pointerEvents = 'none';
        });

        submitAnswerBtn.classList.add('hidden');
        nextQuestionBtn.classList.remove('hidden');

        // Store result for review
        question.userAnswer = selectedAnswer;
        question.correct = correct;
    }

    function nextQuestion() {
        currentQuizIndex++;
        if (currentQuizIndex < quizQuestions.length) {
            showQuizQuestion(currentQuizIndex);
        } else {
            showQuizResults();
        }
    }

    function showQuizResults() {
        quizContent.classList.add('hidden');
        quizResults.classList.remove('hidden');

        const timeTaken = Math.floor((Date.now() - quizStartTime) / 1000);
        const minutes = Math.floor(timeTaken / 60);
        const seconds = timeTaken % 60;

        document.getElementById('final-score').textContent = Math.round((quizScore / quizQuestions.length) * 100) + '%';
        document.getElementById('correct-answers').textContent = quizScore + '/' + quizQuestions.length;
        document.getElementById('time-taken').textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;

        // Show breakdown
        const breakdown = document.getElementById('results-breakdown');
        breakdown.innerHTML = '<h3>Question Review:</h3>';
        
        quizQuestions.forEach((q, i) => {
            const resultDiv = document.createElement('div');
            resultDiv.className = `result-item ${q.correct ? 'correct' : 'incorrect'}`;
            resultDiv.innerHTML = `
                <p><strong>Q${i + 1}:</strong> ${q.question}</p>
                <p><strong>Your answer:</strong> ${q.options[q.userAnswer]}</p>
                ${!q.correct ? `<p><strong>Correct answer:</strong> ${q.answer}</p>` : ''}
            `;
            breakdown.appendChild(resultDiv);
        });
    }

    // Reference Functions
    function loadReference() {
        const container = document.getElementById('reference-content');
        
        if (!container) {
            console.error('Container not found');
            return;
        }
        
        // Check if data exists
        if (typeof interviewData === 'undefined') {
            console.error('interviewData is undefined');
            container.innerHTML = '<p style="color: red;">Error: Interview data not loaded. Please refresh the page.</p>';
            return;
        }
        
        container.innerHTML = '';
        
        let totalItems = 0;
        
        // Iterate through categories
        for (const category in interviewData) {
            if (interviewData.hasOwnProperty(category)) {
                const questions = interviewData[category];
                
                if (Array.isArray(questions)) {
                    questions.forEach(item => {
                        const div = document.createElement('div');
                        div.className = 'reference-item';
                        div.dataset.category = category;
                        // Add inline styles to ensure visibility
                        div.style.cssText = 'background: white; border: 1px solid #ddd; padding: 20px; margin-bottom: 15px; border-radius: 10px;';
                        div.innerHTML = `
                            <h4 style="color: #333; font-size: 18px; margin-bottom: 10px; font-weight: bold;">
                                ${item.question}
                                <span class="category-tag" style="background: #2563eb; color: white; padding: 4px 12px; border-radius: 15px; font-size: 14px; margin-left: 10px;">${getCategoryName(category)}</span>
                            </h4>
                            <p style="color: #555; font-size: 16px; line-height: 1.6; margin: 0;">${item.answer}</p>
                        `;
                        container.appendChild(div);
                        totalItems++;
                    });
                }
            }
        }
        
        // If no items were added, show a message
        if (totalItems === 0) {
            container.innerHTML = '<p style="color: red; font-size: 18px;">No questions found. Please check the console for errors.</p>';
        } else {
            // Add a test message at the top
            const testDiv = document.createElement('div');
            testDiv.style.cssText = 'background: yellow; color: black; padding: 20px; margin-bottom: 20px; font-size: 18px; font-weight: bold;';
            testDiv.textContent = `Successfully loaded ${totalItems} questions. If you can see this but not the questions below, there is a CSS issue.`;
            container.insertBefore(testDiv, container.firstChild);
        }
    }

    function filterReference() {
        const searchTerm = document.getElementById('search-reference').value.toLowerCase();
        const items = document.querySelectorAll('.reference-item');

        items.forEach(item => {
            const text = item.textContent.toLowerCase();
            item.style.display = text.includes(searchTerm) ? 'block' : 'none';
        });
    }

    function filterReferenceByCategory(category) {
        const items = document.querySelectorAll('.reference-item');

        items.forEach(item => {
            if (category === 'all' || item.dataset.category === category) {
                item.style.display = 'block';
            } else {
                item.style.display = 'none';
            }
        });
    }

    // Helper Functions
    function getCategoryName(category) {
        const names = {
            dotnet: '.NET/C#',
            angular: 'Angular',
            aiml: 'AI/ML',
            python: 'Python',
            sql: 'SQL/Oracle',
            system: 'System Design',
            behavioral: 'Behavioral'
        };
        return names[category] || category;
    }

    function shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    // Coding Challenge Functions
    function startCodingChallenges() {
        if (!window.codingChallenges) {
            console.error('Coding challenges not loaded');
            return;
        }
        
        resetCodingChallenges();
        codingChallengesList = shuffleArray([...window.codingChallenges]).slice(0, 10);
        
        codingContent.classList.remove('hidden');
        codingComplete.classList.add('hidden');
        
        document.getElementById('coding-total').textContent = codingChallengesList.length;
        document.getElementById('total-challenges').textContent = codingChallengesList.length;
        
        showCodingChallenge(0);
    }
    
    function resetCodingChallenges() {
        codingChallengesList = [];
        currentChallengeIndex = 0;
        codingScore = 0;
        selectedCodeAnswer = null;
        document.getElementById('coding-score').textContent = '0';
    }
    
    function showCodingChallenge(index) {
        const challenge = codingChallengesList[index];
        
        document.getElementById('current-challenge').textContent = index + 1;
        
        const card = document.querySelector('.challenge-card');
        card.querySelector('.challenge-category').textContent = challenge.category;
        card.querySelector('.challenge-difficulty').textContent = challenge.difficulty;
        card.querySelector('.challenge-difficulty').setAttribute('data-level', challenge.difficulty);
        card.querySelector('.challenge-title').textContent = challenge.title;
        card.querySelector('.challenge-description').textContent = challenge.description;
        
        // Add code with expand button
        const codeContainer = card.querySelector('.challenge-code');
        codeContainer.innerHTML = ''; // Clear existing content
        
        const codeElement = document.createElement('code');
        codeElement.textContent = challenge.code;
        codeContainer.appendChild(codeElement);
        
        // Add expand button to coding challenges
        const expandBtn = document.createElement('button');
        expandBtn.className = 'code-expand-btn';
        expandBtn.innerHTML = '<i class="fas fa-expand"></i> Expand';
        expandBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            openCodeModal(challenge.code, `${challenge.title} - ${challenge.category}`);
        });
        codeContainer.appendChild(expandBtn);
        
        card.querySelector('.challenge-question').textContent = challenge.question;
        
        const optionsContainer = document.getElementById('challenge-options');
        optionsContainer.innerHTML = '';
        
        challenge.options.forEach((option, i) => {
            const optionDiv = document.createElement('div');
            optionDiv.className = 'code-option';
            optionDiv.innerHTML = `
                <input type="radio" name="code-answer" id="code-option${i}" value="${i}">
                <label for="code-option${i}" class="code-option-text">${option}</label>
            `;
            optionDiv.addEventListener('click', function() {
                const radio = this.querySelector('input[type="radio"]');
                radio.checked = true;
                selectCodeAnswer(i);
            });
            optionsContainer.appendChild(optionDiv);
        });
        
        // Reset state
        selectedCodeAnswer = null;
        submitCodeAnswerBtn.disabled = true;
        submitCodeAnswerBtn.classList.remove('hidden');
        nextChallengeBtn.classList.add('hidden');
    }
    
    function selectCodeAnswer(index) {
        selectedCodeAnswer = index;
        submitCodeAnswerBtn.disabled = false;
        
        // Update visual state
        document.querySelectorAll('.code-option').forEach(opt => {
            opt.classList.remove('selected');
        });
        document.querySelectorAll('.code-option')[index].classList.add('selected');
    }
    
    function submitCodeAnswer() {
        const challenge = codingChallengesList[currentChallengeIndex];
        const correct = selectedCodeAnswer === challenge.correct;
        
        if (correct) {
            codingScore++;
            document.getElementById('coding-score').textContent = codingScore;
        }
        
        // Show correct/incorrect
        document.querySelectorAll('.code-option').forEach((opt, i) => {
            if (i === challenge.correct) {
                opt.classList.add('correct');
            } else if (i === selectedCodeAnswer && !correct) {
                opt.classList.add('incorrect');
            }
            opt.style.pointerEvents = 'none';
        });
        
        // Add explanation
        const explanationDiv = document.createElement('div');
        explanationDiv.className = 'review-explanation';
        explanationDiv.innerHTML = `<strong>Explanation:</strong> ${challenge.explanation}`;
        document.querySelector('.challenge-card').appendChild(explanationDiv);
        
        submitCodeAnswerBtn.classList.add('hidden');
        nextChallengeBtn.classList.remove('hidden');
        
        // Store result
        challenge.userAnswer = selectedCodeAnswer;
        challenge.correct = correct;
    }
    
    function nextCodingChallenge() {
        currentChallengeIndex++;
        
        // Remove explanation from previous challenge
        const explanation = document.querySelector('.review-explanation');
        if (explanation) {
            explanation.remove();
        }
        
        if (currentChallengeIndex < codingChallengesList.length) {
            showCodingChallenge(currentChallengeIndex);
        } else {
            showCodingResults();
        }
    }
    
    function showCodingResults() {
        codingContent.classList.add('hidden');
        codingComplete.classList.remove('hidden');
        
        const percentage = Math.round((codingScore / codingChallengesList.length) * 100);
        document.getElementById('final-coding-score').textContent = percentage + '%';
        document.getElementById('correct-coding-answers').textContent = codingScore + '/' + codingChallengesList.length;
        
        // Show review
        const reviewContainer = document.getElementById('coding-review');
        reviewContainer.innerHTML = '<h3>Challenge Review:</h3>';
        
        codingChallengesList.forEach((challenge, i) => {
            const reviewItem = document.createElement('div');
            reviewItem.className = `review-item ${challenge.correct ? 'correct' : 'incorrect'}`;
            reviewItem.innerHTML = `
                <p><strong>Challenge ${i + 1}:</strong> ${challenge.title}</p>
                <p><strong>Your answer:</strong> ${challenge.options[challenge.userAnswer]}</p>
                ${!challenge.correct ? `<p><strong>Correct answer:</strong> ${challenge.options[challenge.correct]}</p>` : ''}
                <div class="review-explanation">
                    <strong>Explanation:</strong> ${challenge.explanation}
                </div>
            `;
            reviewContainer.appendChild(reviewItem);
        });
    }

    // Code expansion modal functions
    function openCodeModal(code, title = 'Code Example') {
        if (!codeModal || !expandedCode) return;
        
        // Set the title
        const modalTitle = codeModal.querySelector('.code-modal-title');
        if (modalTitle) {
            modalTitle.textContent = title;
        }
        
        // Set the code content
        expandedCode.textContent = code;
        
        // Show the modal
        codeModal.style.display = 'block';
        document.body.style.overflow = 'hidden'; // Prevent scrolling
    }

    function closeCodeModal() {
        if (!codeModal) return;
        
        codeModal.style.display = 'none';
        document.body.style.overflow = ''; // Restore scrolling
    }

    function copyExpandedCode() {
        if (!expandedCode) return;
        
        const codeText = expandedCode.textContent;
        
        // Create a temporary textarea element
        const textarea = document.createElement('textarea');
        textarea.value = codeText;
        textarea.style.position = 'fixed';
        textarea.style.top = '-9999px';
        document.body.appendChild(textarea);
        
        // Select and copy the text
        textarea.select();
        textarea.setSelectionRange(0, 99999); // For mobile devices
        
        try {
            document.execCommand('copy');
            
            // Show feedback
            const originalText = copyCodeBtn.innerHTML;
            copyCodeBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
            copyCodeBtn.classList.add('btn-success');
            
            setTimeout(() => {
                copyCodeBtn.innerHTML = originalText;
                copyCodeBtn.classList.remove('btn-success');
            }, 2000);
        } catch (err) {
            console.error('Failed to copy code:', err);
        }
        
        // Clean up
        document.body.removeChild(textarea);
    }

    // Practice Mode Functions
    function showPracticeMode(card, cardIndex) {
        currentPracticeCard = card;
        selectedPracticeAnswer = null;
        
        // Show overlay
        practiceOverlay.classList.remove('hidden');
        
        // Set question
        const questionText = practiceOverlay.querySelector('.practice-question-text');
        questionText.textContent = card.question;
        
        // Generate wrong answers
        const allCards = currentFlashcards.filter((c, i) => i !== cardIndex && c.category === card.category);
        const wrongAnswers = [];
        
        // Get 3 wrong answers from same category
        const shuffled = allCards.sort(() => Math.random() - 0.5);
        for (let i = 0; i < Math.min(3, shuffled.length); i++) {
            wrongAnswers.push(shuffled[i].answer);
        }
        
        // If not enough from same category, get from other categories
        if (wrongAnswers.length < 3) {
            const otherCards = currentFlashcards.filter((c, i) => 
                i !== cardIndex && 
                c.category !== card.category &&
                !wrongAnswers.includes(c.answer)
            ).sort(() => Math.random() - 0.5);
            
            const needed = 3 - wrongAnswers.length;
            for (let i = 0; i < Math.min(needed, otherCards.length); i++) {
                wrongAnswers.push(otherCards[i].answer);
            }
        }
        
        // Create options array with correct answer
        const options = [card.answer, ...wrongAnswers].sort(() => Math.random() - 0.5);
        
        // Clear previous options
        practiceOptionsContainer.innerHTML = '';
        practiceFeedback.classList.add('hidden');
        
        // Create option elements
        options.forEach((option, index) => {
            const optionEl = document.createElement('div');
            optionEl.className = 'practice-option';
            optionEl.textContent = option;
            optionEl.dataset.index = index;
            optionEl.dataset.answer = option;
            
            optionEl.addEventListener('click', function() {
                selectPracticeAnswer(this, option === card.answer);
            });
            
            practiceOptionsContainer.appendChild(optionEl);
        });
    }

    function selectPracticeAnswer(element, isCorrect) {
        if (selectedPracticeAnswer !== null) return; // Already answered
        
        selectedPracticeAnswer = element.dataset.answer;
        
        // Mark selected
        element.classList.add('selected');
        element.classList.add(isCorrect ? 'correct' : 'incorrect');
        
        // Show correct answer if wrong
        if (!isCorrect) {
            const options = practiceOptionsContainer.querySelectorAll('.practice-option');
            options.forEach(opt => {
                if (opt.dataset.answer === currentPracticeCard.answer) {
                    opt.classList.add('correct');
                }
            });
        }
        
        // Show feedback
        const feedbackText = practiceFeedback.querySelector('.feedback-text');
        if (isCorrect) {
            feedbackText.textContent = '🎉 Correct! Great job!';
            feedbackText.className = 'feedback-text correct';
        } else {
            feedbackText.textContent = '❌ Not quite. The correct answer is highlighted above.';
            feedbackText.className = 'feedback-text incorrect';
        }
        
        practiceFeedback.classList.remove('hidden');
    }

    function closePracticeMode() {
        practiceOverlay.classList.add('hidden');
        currentPracticeCard = null;
        selectedPracticeAnswer = null;
    }
});