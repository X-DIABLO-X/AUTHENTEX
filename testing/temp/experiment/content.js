(function() {
 console.log("Review Analyzer Extension Started"); 
 
 const API_URL =` https://nlp-parameter-907415986378.asia-south2.run.app`
 const API_KEY = `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`

 async function ReviewAnalysis(review) {

    try{
        const response = await fetch(API_URL, {
            method: "POST",
            headers :{
                "Content-Type": "application/json",
            body: JSON.stringify({ review: reviewContent })
        }
        });
        if(!response.ok){
            throw new Error("Network response was not ok");
        }
        const data = await response.json();
        console.log(data);
        return data
    }

  

    catch(error){
        console.error("Error:", error);
    }
 }




























})