const url = `https://nlp-parameter-907415986378.asia-south2.run.app/analyze_review?review_text=Pizza is good&place_type=food place`;

    fetch(url)
    .then(response => {
        if (!response.ok) {
        throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        console.log('Data received:', data);
    })
    .catch(error => {
        console.error('There was a problem with the fetch operation:', error);
    });
