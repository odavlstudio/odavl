// Product Hunt upvote tracking (launch day)
export async function trackUpvotes() {
  const response = await fetch('https://api.producthunt.com/v2/api/graphql', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${process.env.PH_TOKEN}` },
    body: JSON.stringify({
      query: `{ post(id: "odavl-studio") { votesCount commentsCount } }`
    })
  });
  
  const data = await response.json();
  return data.data.post;
}
