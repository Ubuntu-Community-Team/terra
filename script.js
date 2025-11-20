const PROCESSED_FEEDS_FILE = './feed-data.json';
const container = document.getElementById('feed-container');

async function initAggregator() {
    try {
        // 1. Fetch the single, pre-processed JSON file from your own repo
        const response = await fetch(PROCESSED_FEEDS_FILE);
        const processedFeeds = await response.json();
        
        document.getElementById('loading-message')?.remove(); // Use optional chaining for safety

        // 2. Iterate and render the pre-processed data (Fast!)
        processedFeeds.forEach(item => {
            const feedCard = document.createElement('div');
            feedCard.className = 'feed-card';
            
            const formattedDate = new Date(item.date).toLocaleDateString();

            feedCard.innerHTML = `
                <h2>${item.sourceName}</h2>
                <a href="${item.link}" target="_blank" rel="noopener noreferrer">${item.title}</a>
                <p class="date">${formattedDate}</p>
            `;
            container.appendChild(feedCard);
        });

    } catch (error) {
        console.error("Failed to load member feed data. Ensure the GitHub Action ran successfully.", error);
        container.innerHTML = '<p class="error-msg">Could not load the latest content! Please check back later. If this keeps happening, feel free to drop in an issue on the Github</p>';
    }
}

initAggregator();
