from flask import Flask, render_template, jsonify
import json

app = Flask(__name__)

# Load the data from mortality.json
with open('mortality.json') as f:
    data = json.load(f)

@app.route('/')
def index():
    return render_template('index.html')
@app.route('/get_data/<search_term>')
def get_filtered_data(search_term):
    if search_term.lower() == 'all':
        # Send the entire dataset
        return jsonify(data)
    else:
        # Filter the dataset for the specific country
        filtered_data = [entry for entry in data if entry['Country'].lower() == search_term.lower()]
        return jsonify(filtered_data)

if __name__ == '__main__':
    app.run(debug=True)
