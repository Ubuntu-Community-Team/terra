const fs = require('fs/promises');
const Parser = require('rss-parser');

const FEEDS_FILE = './feeds.json';
const OUTPUT_FILE = './feed-data.json';

const parser = new Parser({
    // Only fetch the newest blog post from each feed to save on bandwidth
    maxRedirects: 10,
    headers: {
        'User-Agent': 'Static-RSS-Aggregator-GitHub-Action/1.0',
    },
    // Pull in some extra fields when available
    customFields: {
        item: [
            'content:encoded',
            'dc:creator'
        ]
    }
});

// Pull snippet from latest feed entry (plain text)
function sanitizeSnippet(html) {
    if (!html) return '';

    // Remove all HTML tags
    let text = html.replace(/<[^>]*>/g, '');

    // Decode common HTML entities
    text = text.replace(/&amp;/g, '&')
               .replace(/&quot;/g, '"')
               .replace(/&#39;/g, "'")
               .replace(/&lt;/g, '<')
               .replace(/&gt;/g, '>');

    // Trim whitespace
    return text.trim();
}

// Keep a full HTML version for the RSS feed
function cleanHtmlContent(html) {
    if (!html) return '';

    // Strip scripts/styles for safety/size and keep the rest
    return html
        .replace(/<script[\s\S]*?<\/script>/gi, '')
        .replace(/<style[\s\S]*?<\/style>/gi, '')
        .trim();
}

async function processFeeds() {
    console.log('Starting feed processing...');

    // Read the list of feeds
    const feedsJson = await fs.readFile(FEEDS_FILE, 'utf-8');
    const feedsList = JSON.parse(feedsJson);

    const processedData = [];

    for (const feedConfig of feedsList) {
        try {
            // Fetch the feeds and parse
            const feed = await parser.parseURL(feedConfig.url);

            // Grab the latest entry from each member feed
            const latestItem = feed.items[0];

            if (latestItem) {
                // Prefer full content when it's available
                const fullRawContent =
                    latestItem['content:encoded'] ||
                    latestItem.content ||
                    latestItem.summary ||
                    latestItem.description ||
                    '';

                // Full HTML for RSS XML
                const contentHtml = cleanHtmlContent(fullRawContent);

                // Plain-text snippet for the planet website
                const cleanSnippet = sanitizeSnippet(fullRawContent);

                // Trim the snippet to 500 characters
                const finalSnippet =
                    cleanSnippet.substring(0, 500) +
                    (cleanSnippet.length > 500 ? '...' : '');

                // Pull author name
                const author =
                    latestItem.creator ||
                    latestItem['dc:creator'] ||
                    (Array.isArray(latestItem.authors)
                        ? latestItem.authors.join(', ')
                        : null);

                // Categories / tags
                const categories = Array.isArray(latestItem.categories)
                    ? latestItem.categories
                    : [];

                // Image url handling
                let imageUrl = null;
                if (latestItem.enclosure && latestItem.enclosure.url) {
                    imageUrl = latestItem.enclosure.url;
                }

                processedData.push({
                    sourceName: feedConfig.name,
                    sourceUrl: feedConfig.url,
                    title: latestItem.title || 'No Title Available',
                    link: latestItem.link,
                    date: latestItem.pubDate
                        ? new Date(latestItem.pubDate).toISOString()
                        : new Date().toISOString(),
                    snippet: finalSnippet,
                    contentHtml,
                    author,
                    categories,
                    imageUrl
                });
            }
        } catch (error) {
            console.error(`Skipping failed feed: ${feedConfig.name}. Error: ${error.message}`);
        }
    }

    // Sort feed posts by date
    processedData.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Write the feed post JSON data to a file for the site to render
    await fs.writeFile(OUTPUT_FILE, JSON.stringify(processedData, null, 2));

    console.log(`Successfully processed ${processedData.length} entries and saved to ${OUTPUT_FILE}`);
    process.exit(0);
}

processFeeds().catch(e => {
    console.error('FATAL ERROR in feed processor:', e);
    // For when it dies a horrible death
    process.exit(1);
});
