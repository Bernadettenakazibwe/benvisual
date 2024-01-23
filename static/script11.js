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

    // Ensure that the filteredData has the required properties (Name, BloodPressure, Glucose)
    const requiredProperties = ['Country', 'BloodPressure', 'Glucose'];
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
        .domain(filteredData.map(d => d.Name))
        .range([0, width])
        .padding(0.1);

    const yScale = d3.scaleLinear()
        .domain([0, d3.max(filteredData, d => Math.max(d.BloodPressure, d.Glucose))])
        .range([height, 0]);

    // Define a color scale for BloodPressure
    const colorScaleBloodPressure = d3.scaleLinear()
        .domain([60, 90, d3.max(filteredData, d => d.BloodPressure)])
        .range(["#ffcccc", "#ff6666", "#ff0000"]); // Specify the color range for BloodPressure (light red to dark red)

    // Define a color scale for Glucose
    const colorScaleGlucose = d3.scaleLinear()
        .domain([70, 99, d3.max(filteredData, d => d.Glucose)])
        .range(["#cce5ff", "#4d94ff", "#0066ff"]); // Specify the color range for Glucose (light blue to dark blue)

    // Add red bars for BloodPressure
    svg.selectAll(".bar-bloodpressure")
        .data(filteredData)
        .enter()
        .append("rect")
        .attr("class", "bar-bloodpressure")
        .attr("x", d => xScale(d.Name))
        .attr("y", d => yScale(d.BloodPressure))
        .attr("width", xScale.bandwidth() / 3)
        .attr("height", d => height - yScale(d.BloodPressure))
        .attr("fill", d => colorScaleBloodPressure(d.BloodPressure)) // Use the color scale for BloodPressure
        .on("click", d => displayBarsForName(d)); // Add a click event listener

    // Add blue bars for Glucose
    svg.selectAll(".bar-glucose")
        .data(filteredData)
        .enter()
        .append("rect")
        .attr("class", "bar-glucose")
        .attr("x", d => xScale(d.Name) + xScale.bandwidth() * 2 / 3)
        .attr("y", d => yScale(d.Glucose))
        .attr("width", xScale.bandwidth() / 3)
        .attr("height", d => height - yScale(d.Glucose))
        .attr("fill", d => colorScaleGlucose(d.Glucose)) // Use the color scale for Glucose
        .on("click", d => displayBarsForName(d)); // Add a click event listener

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

    // Add names below the bars if filteredData is not the entire dataset
    if (filteredData !== data) {
        svg.selectAll(".bar-names")
            .data(filteredData)
            .enter()
            .append("text")
            .attr("class", "bar-names")
            .attr("x", d => xScale(d.Name) + xScale.bandwidth() / 2)
            .attr("y", height + margin.top + 350)
            .attr("text-anchor", "middle")
            .text(d => d.Name)
            .style("font-size", "12px")
            .style("cursor", "pointer")  // Set the cursor to pointer
            .on("click", d => displayBarsForName(d));  // Add a click event listener
    }

// Add red legend for BloodPressure
const legendBloodPressure = d3.select("svg")
    .append("g")
    .attr("transform", "translate(-2, 1)"); // Move 10 units to the right and 20 units up

legendBloodPressure.append("rect")
    .attr("width", 15)
    .attr("height", 15)
    .attr("fill", "#ff0000"); // Red color for BloodPressure

legendBloodPressure.append("text")
    .attr("x", 25)
    .attr("y", 10)
    .text("BloodPressure")
    .style("font-size", "12px");

// Add blue legend for Glucose
const legendGlucose = d3.select("svg")
    .append("g")
    .attr("transform", "translate(-2, 20)"); // Move 10 units to the right and 5 units up

legendGlucose.append("rect")
    .attr("width", 15)
    .attr("height", 15)
    .attr("fill", "#0066ff"); // Blue color for Glucose

legendGlucose.append("text")
    .attr("x", 25)
    .attr("y", 10)
    .text("Glucose")
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
// Function to display details for a specific name
function displayDetails(selectedData, allData) {
    // Check if selectedData and its properties are available
    if (!selectedData || typeof selectedData !== 'object' || !('Name' in selectedData)) {
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
        <h3>${selectedData.Name}</h3>
        <p>Date of Birth: ${selectedData.DateOfBirth || 'N/A'}</p>
        <p>Age: ${selectedData.Age || 'N/A'}</p>
        <img src="static/images/${selectedData.Picture || 'default.jpg'}" alt="${selectedData.Name}" style="max-width: 100%; height: auto;">
    `);

    // Display the details div
    detailsDiv.transition()
        .duration(200)
        .style("opacity", 1);
}



// Function to display bars for a specific name
function displayBarsForName(selectedData) {
    // Create a subset of data containing only the selected name
    const subsetData = data.filter(d => d.Name === selectedData.Name);

    // Update the heatmap with the subset data
    updateHeatmap(subsetData);

    // Display details for the selected name
    displayDetails(selectedData.Name, data);
}

// Function to display details for a specific name
// Function to display details for a specific name
function displayDetails(selectedData, allData) {
    // Create a subset of data containing only the selected name
    const subsetData = allData.filter(d => d.Name === selectedData);

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
        <h3>${subsetData[0].Name}</h3>
        <p>Date of Birth: ${subsetData[0].DateOfBirth}</p>
        <p>Age: ${subsetData[0].Age}</p>
        <p>Glucose: ${subsetData[0].Glucose}</p>
        <p>Blood Pressure: ${subsetData[0].BloodPressure}</p>
        <img src="static/images/${subsetData[0].Picture}" alt="${subsetData[0].Name}" style="max-width: 100%; height: auto;">
    `);

    // Display the details div
    detailsDiv.transition()
        .duration(200)
        .style("opacity", 1);
}