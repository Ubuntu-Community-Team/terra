const PROCESSED_FEEDS_FILE = './feed-data.json';
const container = document.getElementById('feed-container');

async function initAggregator() {
    try {
        const response = await fetch(PROCESSED_FEEDS_FILE);
        const processedFeeds = await response.json();
        
        document.getElementById('loading-message')?.remove(); 

        processedFeeds.forEach(item => {
            
            // Create vanilla container for the column 
            const columnWrapper = document.createElement('div');
            columnWrapper.className = 'col-4 u-spacing'; 

            // Create the p-card for feed
            const feedCard = document.createElement('div');
            feedCard.className = 'p-card'; 
            
            // Format the date for display
            const formattedDate = new Date(item.date).toLocaleDateString();

            // Fill vanilla card with feed data
            feedCard.innerHTML = `
                <div class="p-card__content">
                    <p class="p-heading--6 u-no-margin--bottom">${item.sourceName}</p>
                    <hr class="u-sv-1" />
                    <h3 class="p-heading--4">
                        <a href="${item.link}" target="_blank" rel="noopener noreferrer">
                            ${item.title}
                        </a>
                    </h3>
                    <p class="u-small-text">
                        Published: <strong>${formattedDate}</strong>
                    </p>
                </div>
            `;
            
            // Append the card to the column wrapper
            columnWrapper.appendChild(feedCard);
            
            // Append the column wrapper to the main container
            container.appendChild(columnWrapper);
        });

    } catch (error) {
        console.error("Failed to load processed feed data.", error);
        container.innerHTML = '<p class="p-notification--negative">Could not load member feeds. Please check back later. If issue persists, post issue on planet Github repo.</p>';
    }
}

initAggregator();
