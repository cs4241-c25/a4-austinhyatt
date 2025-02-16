import { useState, useEffect } from "react";
import axios from "axios";

const Dashboard = () => {
  const [name, setName] = useState("");
  const [score, setScore] = useState("");
  const [date, setDate] = useState("");
  const [scores, setScores] = useState([]);

  // Fetch scores when component loads
  useEffect(() => {
    fetchScores();
  }, []);

  // Function to submit a new high score
  const submitScore = async (event) => {
    event.preventDefault();

    const newScore = {
      username: localStorage.getItem("user"),
      name,
      score,
      date,
    };

    await axios.post("http://localhost:5000/submit", newScore);
    fetchScores(); // Refresh the scoreboard
  };

  // Fetch scores from the server
  const fetchScores = async () => {
    try {
      const response = await axios.post("http://localhost:5000/check", {
        user: localStorage.getItem("user"),
      });
  
      console.log("Server response:", response.data); // Debugging line
  
      if (Array.isArray(response.data)) {
        setScores(response.data);
      } else {
        console.error("Error: Server did not return an array", response.data);
        setScores([]); // Ensure scores is always an array
      }
    } catch (error) {
      console.error("Error fetching scores:", error);
      setScores([]); // Fallback to empty array to avoid crashes
    }
  };
  

  // Enable edit mode for a specific score
  const enableEditMode = (index) => {
    const updatedScores = [...scores];
    updatedScores[index].isEditing = true;
    setScores(updatedScores);
  };

  // Handle saving an edited score
  const saveEdit = async (index) => {
    const updatedEntry = scores[index];

    await axios.post("http://localhost:5000/edit", {
      index,
      name: updatedEntry.name,
      score: updatedEntry.score,
      date: updatedEntry.date,
    });

    updatedEntry.isEditing = false;
    fetchScores();
  };

  // Handle deleting a score
  const deleteScore = async (index) => {
    await axios.post("http://localhost:5000/delete", { index });
    fetchScores();
  };

  return (
    <div id="myDiv1">
      <h2>High Scores</h2>
      
      {/* Input Form */}
      <form onSubmit={submitScore}>
        <input
          type="text"
          placeholder="Name"
          className="nes-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input
          type="number"
          placeholder="Score"
          className="nes-input"
          value={score}
          onChange={(e) => setScore(e.target.value)}
          required
        />
        <input
          type="date"
          value={date}
          className="nes-input"
          onChange={(e) => setDate(e.target.value)}
          required
        />
        <button type="submit" className="nes-btn is-warning">Submit</button>
        <button type="button" className="nes-btn is-warning" onClick={fetchScores}>Check Scores</button>
      </form>

      <br />

      {/* High Score Table */}
      <table class="nes-table is-bordered is-centered">
        <thead>
          <tr>
            <th>#</th>
            <th>Name</th>
            <th>Score</th>
            <th>Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {scores.map((entry, index) => (
            <tr key={index}>
              <td>{index + 1}</td>

              {/* Editable fields */}
              {entry.isEditing ? (
                <>
                  <td>
                    <input
                      type="text"
                      value={entry.name}
                      onChange={(e) => {
                        const updatedScores = [...scores];
                        updatedScores[index].name = e.target.value;
                        setScores(updatedScores);
                      }}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      value={entry.score}
                      onChange={(e) => {
                        const updatedScores = [...scores];
                        updatedScores[index].score = e.target.value;
                        setScores(updatedScores);
                      }}
                    />
                  </td>
                  <td>
                    <input
                      type="date"
                      value={entry.date}
                      onChange={(e) => {
                        const updatedScores = [...scores];
                        updatedScores[index].date = e.target.value;
                        setScores(updatedScores);
                      }}
                    />
                  </td>
                  <td>
                    <button onClick={() => saveEdit(index)}>Save</button>
                    <button onClick={() => deleteScore(index)}>Delete</button>
                  </td>
                </>
              ) : (
                <>
                  <td>{entry.name}</td>
                  <td>{entry.score}</td>
                  <td>{entry.date}</td>
                  <td>
                    <button onClick={() => enableEditMode(index)}>Edit</button>
                    <button onClick={() => deleteScore(index)}>Delete</button>
                  </td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Dashboard;

