import csv
import os

from sklearn.pipeline import Pipeline
from sklearn.feature_extraction.text import TfidfVectorizer, CountVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression



def train():

    # Get list of data
    data = load_data()

    # set x and y
    x = [row["evidence"] for row in data]
    y = [row["label"] for row in data]

    # Splitting data
    x_train, x_test, y_train, y_test = split_data(x, y)

    # Getting model
    model = configure_model()

    # Train the model
    model.fit(x_train, y_train)

    # Test the model
    test(model, x_test, y_test)

    return model



# Load the data from the CSV
def load_data(filename: str = "bioscience_classifier_dataset_expanded.csv") -> list:

    base_dir = os.path.dirname(os.path.abspath(__file__))
    path = os.path.join(base_dir, filename)
    
    # opening csv
    with open(path) as f:

        # Skipping header
        reader = csv.reader(f)  
        next(reader)
        data = []
        for row in reader:
            data.append({
                "evidence": row[0] + " " + row[1],
                "label": int(row[2])
            })
    return data

# Splits data
def split_data(x: list, y: list):

    # Splitting into train and test data (reproducable so accuracy doesnt fluctuate)
    return train_test_split(
        x, y, test_size = 0.2, random_state=42, stratify = y
    )

# Returns custom model
def configure_model():

    # Text classifier
    pipeline = Pipeline([
        ("vectorizer", CountVectorizer(ngram_range=(1, 3))),
        ("classifier", MultinomialNB())
    ])

    return pipeline

# Test the model accuracy on test data
def test(model, x_test, y_test):
    correct = 0
    incorrect = 0
    total = 0

    # Predict data
    predictions = model.predict(x_test)

    # Looping through test data
    for actual, predicted in zip(y_test, predictions):
        total += 1

        if actual == predicted:
            correct += 1
        else:
            incorrect += 1

    print(f"Correct: {correct}")
    print(f"Incorrect: {incorrect}")
    print(f"Cases: {total}")
    print(f"Accuracy: {((correct/total) * 100):.2f}%")

if __name__ == "__main__":
    train()