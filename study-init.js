// Initialize interview data and ensure it's available globally
(function() {
    // Check if interviewData is already defined
    if (typeof window.interviewData === 'undefined') {
        console.error('Interview data not loaded. Attempting to load...');
        
        // Try to access it from the global scope
        if (typeof interviewData !== 'undefined') {
            window.interviewData = interviewData;
            console.log('Interview data loaded successfully');
        } else {
            console.error('Failed to load interview data');
        }
    } else {
        console.log('Interview data already available');
    }
    
    // Verify data structure
    if (window.interviewData) {
        let totalQuestions = 0;
        for (const category in window.interviewData) {
            if (window.interviewData.hasOwnProperty(category)) {
                totalQuestions += window.interviewData[category].length;
            }
        }
        console.log(`Total questions loaded: ${totalQuestions}`);
    }
})();