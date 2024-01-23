let data;

// Fetch the dataset from Flask backend on page load
fetch('/get_data/all')
    .then(response => response.json())
    .then(initialData => {
        data = initialData;
        // Display the initial heatmap for the entire dataset
        updateHeatmap(data);
    })
    .catch(error => console.error('Error fetching initial data:', error));

// D3.js heatmap code
function updateHeatmap(filteredData) {
    // Clear previous content
    d3.select("#heatmap").selectAll("*").remove();

    // Check if filteredData has the expected structure
    if (!filteredData || !Array.isArray(filteredData) || filteredData.length === 0) {
        console.error('Invalid or empty data:', filteredData);
        return;
    }

    
    const requiredProperties = ['Country', 'Year', 'Underfive_mortality_rate'];
    if (!requiredProperties.every(prop => prop in filteredData[0])) {
        console.error('Data does not have the required properties:', filteredData[0]);
        return;
    }

    // Define the dimensions of the heatmap
    const margin = { top: 80, right: 50, bottom: 60, left: 50 };
    const width = 900 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    // Create an SVG element
    const svg = d3.select("#heatmap")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // Set up scales
    const xScale = d3.scaleBand()
        .domain(filteredData.map(d => d.Country))
        .range([0, width])
        .padding(0.1);

    const yScale = d3.scaleLinear()
        .domain([0, d3.max(filteredData, d => Math.max(d.Year, d.Underfive_mortality_rate))])
        .range([height, 0]);

    // Define a color scale for Year
    const colorScaleYear = d3.scaleLinear()
        .domain([60, 90, d3.max(filteredData, d => d.Year)])
        .range(["#ffcccc", "#ff6666", "#ff0000"]); // Specify the color range for Year (light red to dark red)

    // Define a color scale for Underfive_mortality_rate
    const colorScaleUnderfive_mortality_rate = d3.scaleLinear()
        .domain([70, 99, d3.max(filteredData, d => d.Underfive_mortality_rate)])
        .range(["#cce5ff", "#4d94ff", "#0066ff"]); // Specify the color range for Underfive_mortality_rate(light blue to dark blue)

    // Add red bars for Year
    svg.selectAll(".bar-year")
        .data(filteredData)
        .enter()
        .append("rect")
        .attr("class", "bar-year")
        .attr("x", d => xScale(d.Country))
        .attr("y", d => yScale(d.Year))
        .attr("width", xScale.bandwidth() / 3)
        .attr("height", d => height - yScale(d.Year))
        .attr("fill", d => colorScaleYear(d.Year)) // Use the color scale for Year
        .on("click", d => displayBarsForCountry(d)); // Add a click event listener

    // Add blue bars for Underfive_mortality_rate
    svg.selectAll(".bar-Underfive_mortality_rate")
        .data(filteredData)
        .enter()
        .append("rect")
        .attr("class", "bar-Underfive_mortality_rate")
        .attr("x", d => xScale(d.Country) + xScale.bandwidth() * 2 / 3)
        .attr("y", d => yScale(d.Underfive_mortality_rate))
        .attr("width", xScale.bandwidth() / 3)
        .attr("height", d => height - yScale(d.Underfive_mortality_rate))
        .attr("fill", d => colorScaleUnderfive_mortality_rate(d.Underfive_mortality_rate)) // Use the color scale for Underfive_mortality_rate
        .on("click", d => displayBarsForCountry(d)); // Add a click event listener

    // Add x-axis
    svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(xScale))
        .selectAll("text")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end");

    // Add y-axis
    svg.append("g")
        .call(d3.axisLeft(yScale));

    // Add y-axis label
    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - margin.left)
        .attr("x", 0 - (height / 2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .text("Scale");

    // Add countries below the bars if filteredData is not the entire dataset
    if (filteredData !== data) {
        svg.selectAll(".bar-countries")
            .data(filteredData)
            .enter()
            .append("text")
            .attr("class", "bar-countries")
            .attr("x", d => xScale(d.Country) + xScale.bandwidth() / 2)
            .attr("y", height + margin.top + 350)
            .attr("text-anchor", "middle")
            .text(d => d.Country)
            .style("font-size", "12px")
            .style("cursor", "pointer")  // Set the cursor to pointer
            .on("click", d => displayBarsForCountry(d));  // Add a click event listener
    }

// Add red legend for Year
const legendYear = d3.select("svg")
    .append("g")
    .attr("transform", "translate(-2, 1)"); // Move 10 units to the right and 20 units up

legendYear.append("rect")
    .attr("width", 15)
    .attr("height", 15)
    .attr("fill", "#ff0000"); // Red color for Year

legendYear.append("text")
    .attr("x", 30)
    .attr("y", 20)
    .text("Year")
    .style("font-size", "12px");

// Add blue legend for Underfive_mortality_rate
const legendUnderfive_mortality_rate = d3.select("svg")
    .append("g")
    .attr("transform", "translate(-2, 20)"); // Move 10 units to the right and 5 units up

legendUnderfive_mortality_rate.append("rect")
    .attr("width", 15)
    .attr("height", 15)
    .attr("fill", "#0066ff"); // Blue color for Underfive_mortality_rate

legendUnderfive_mortality_rate.append("text")
    .attr("x", 25)
    .attr("y", 10)
    .text("Underfive_mortality_rate")
    .style("font-size", "12px");

}


// Updated filterData function
// Updated filterData function
function filterData(searchTerm) {
    // Get the search input value
    const searchInputValue = (searchTerm === 'all') ? 'all' : document.getElementById("searchInput").value.toLowerCase();

    // Fetch filtered data from Flask backend
    fetch(`/get_data/${searchInputValue}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Failed to fetch data. Status: ${response.status}`);
            }
            return response.json();
        })
        .then(filteredData => {
            // Log received data
            console.log('Received Data:', filteredData);

            // Remove existing details
            d3.select("#details").remove();

            // Check if search term is "all" or filteredData is empty
            if (searchInputValue === "all" || filteredData.length === 0) {
                console.log('Displaying entire dataset');
                updateHeatmap(data);  // Pass 'data' as a parameter
            } else {
                console.log('Displaying filtered data');
                updateHeatmap(filteredData);  // Display the chart for the filtered data

                // Display details if filteredData is not empty
                if (filteredData.length > 0) {
                    displayDetails(filteredData[0], data);
                }
            }
        })
        .catch(error => console.error('Error fetching data:', error));
}
// Function to display details for a specific country
function displayDetails(selectedData, allData) {
    // Check if selectedData and its properties are available
    if (!selectedData || typeof selectedData !== 'object' || !('Country' in selectedData)) {
        console.error('Invalid or missing data:', selectedData);
        return;
    }

    // Create a div for details
    const detailsDiv = d3.select("body").append("div")
        .attr("id", "details")
        .style("position", "absolute")
        .style("background-color", "#f9f9f9")
        .style("padding", "10px")
        .style("border", "1px solid #d4d4d4")
        .style("border-radius", "5px")
        .style("pointer-events", "none")
        .style("opacity", 0);

    // Add details to the div
    detailsDiv.html(`
        <h3>${selectedData.Country}</h3>
        
        <img src="static/images/${selectedData.Country || 'default.png'}" alt="${selectedData.Country}" style="max-width: 100%; height: auto;">
    `);

    // Display the details div
    detailsDiv.transition()
        .duration(200)
        .style("opacity", 1);
}



// Function to display bars for a specific country
function displayBarsForCountry(selectedData) {
    // Create a subset of data containing only the selected country
    const subsetData = data.filter(d => d.Country === selectedData.Country);

    // Update the heatmap with the subset data
    updateHeatmap(subsetData);

    // Display details for the selected counrty
    displayDetails(selectedData.Country, data);
}

// Function to display details for a specific country
// Function to display details for a specific country
function displayDetails(selectedData, allData) {
    // Create a subset of data containing only the selected country
    const subsetData = allData.filter(d => d.Country === selectedData);

    // Remove existing details
    d3.select("#details").remove();

    // Create a div for details
    const detailsDiv = d3.select("body").append("div")
        .attr("id", "details")
        .style("position", "absolute")
        .style("background-color", "#f9f9f9")
        .style("padding", "10px")
        .style("border", "1px solid #d4d4d4")
        .style("border-radius", "5px")
        .style("pointer-events", "none")
        .style("opacity", 0);

    // Add details to the div
    detailsDiv.html(`
        <h3>${subsetData[0].Country}</h3>
        <p>Code: ${subsetData[0].Code}</p>
        
        <p>Un: ${subsetData[0].Underfive_mortality_rate}</p>
        <p>Year: ${subsetData[0].Year}</p>
        <img src="static/images/${subsetData[0].Country}" alt="${subsetData[0].Country}" style="max-width: 100%; height: auto;">
    `);

    // Display the details div
    detailsDiv.transition()
        .duration(200)
        .style("opacity", 1);
}
