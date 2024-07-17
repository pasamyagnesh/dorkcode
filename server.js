const express = require("express");
const path = require("path");
const axios = require("axios");
const app = express();
const { createClient } = require("@supabase/supabase-js");

// Set EJS as the templating engine
app.set('view engine', 'ejs');

// Set the views directory to public/views
app.set('views', path.join(__dirname, 'public', 'views'));

// Middleware to serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Initialize Supabase client
const supabaseUrl = 'https://ftqoudjephxownzjfhcs.supabase.co'; // Replace with your Supabase URL
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ0cW91ZGplcGh4b3duempmaGNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjEwOTg2MTEsImV4cCI6MjAzNjY3NDYxMX0.WuZs_cOEJH9aQb3UTmLaPARaK_v__-g4RVW3KVNmTrE'; // Replace with your Supabase service role key
const supabase = createClient(supabaseUrl, supabaseKey);
// Middleware to increment visitor count and store in Supabase
app.use(async (req, res, next) => {
    try {
        // Fetch current visitor count from Supabase
        const { data: visitorData, error: fetchError } = await supabase
            .from('visitor_count')
            .select('count')
            .eq('id', 1)
            .single();

        if (fetchError) {
            throw new Error('Failed to fetch visitor count');
        }

        // Increment visitor count
        let visitorCount = visitorData ? visitorData.count + 1 : 1;

        // Insert visitor count into Supabase using upsert
        const { data: visitorRecord, error: insertError } = await supabase
            .from('visitor_count')
            .upsert([{ id: 1, count: visitorCount }]);

        if (insertError) {
            throw new Error('Failed to update visitor count');
        }

        console.log('Visitor count:', visitorCount);
        req.visitorCount = visitorCount; // Store visitor count in request object for use in routes
        next();
    } catch (error) {
        console.error('Error updating visitor count:', error);
        next(error); // Pass error to error handling middleware
    }
});

// Route to render the dashboard
app.get('/', async (req, res) => {
    let user;
    let loggedInUser = null; // Initialize loggedInUser as null
    let handle; // Declare handle variable
    let totalSolvedProblems = 0; // Initialize totalSolvedProblems
    const wrongAnswerProblemsSet = new Set();
    const timeLimitExceededProblemsSet = new Set(); // Initialize array for time limit exceeded problems

    try {
        if (req.session && req.session.username) {
            loggedInUser = req.session.username;
        }

        // Fetch accepted submissions for the user
        handle = req.query.handle || '';
        const userSubmissionUrl = `https://codeforces.com/api/user.status?handle=${handle}&from=1&count=100000`;
        const userSubmissionsResponse = await axios.get(userSubmissionUrl);

        if (userSubmissionsResponse.data.status !== 'OK') {
            throw new Error('Failed to fetch user submissions');
        }

        // Filter only accepted submissions
        const acceptedSubmissions = userSubmissionsResponse.data.result.filter(submission => submission.verdict === 'OK');
        const uniqueAcceptedProblems = [...new Set(acceptedSubmissions.map(submission => submission.problem.name))];

        // Separate wrong answer and time limit exceeded problems
        const latestSubmissionsMap = new Map(); // Map to store the latest submission for each problem
        userSubmissionsResponse.data.result.forEach(submission => {
            // Check if the problem is already in the map
            if (latestSubmissionsMap.has(submission.problem.name)) {
                // If it is, compare the submission time to determine if it's the latest one
                const currentSubmissionTime = submission.creationTimeSeconds;
                const previousSubmissionTime = latestSubmissionsMap.get(submission.problem.name).creationTimeSeconds;
                if (currentSubmissionTime > previousSubmissionTime) {
                    // Replace the previous submission with the current one
                    latestSubmissionsMap.set(submission.problem.name, submission);
                }
            } else {
                // If the problem is not in the map, add it
                latestSubmissionsMap.set(submission.problem.name, submission);
            }
        });

        // Iterate through the latest submissions map to separate wrong answer and time limit exceeded problems
        const wrongAnswerProblems = [];
        const timeLimitExceededProblems = [];
        latestSubmissionsMap.forEach(submission => {
            if (submission.verdict === 'WRONG_ANSWER') {
                wrongAnswerProblems.push(submission.problem.name);
            } else if (submission.verdict === 'TIME_LIMIT_EXCEEDED') {
                timeLimitExceededProblems.push(submission.problem.name);
            }
        });

        // Log the arrays for verification
        console.log("Practice tab activated");

        // Count total solved problems
        totalSolvedProblems = uniqueAcceptedProblems.length;

        // Fetch problems based on tags and rating
        const tags = req.query.tags || '';
        const rating = req.query.rating || '';
        const apiUrl = `https://codeforces.com/api/problemset.problems?tags=${tags}&rating=${rating}`;
        const response = await axios.get(apiUrl);
        const problems = response.data.result.problems;
        const apiUrll = `https://codeforces.com/api/user.info?handles=${handle}&checkHistoricHandles=false`;
        const responsee = await axios.get(apiUrll);
        user = responsee.data.result[0]; // Assign user here

        // Insert into Supabase table 'search'
        const { data, error } = await supabase.from('search').insert([
            { cf_id: handle, topic: tags, time: new Date() }
        ]);

        if (error) {
            console.error('Failed to insert search record:', error.message);
            throw new Error('Failed to insert search record');
        }

        res.render('dashboard', {
            uname: loggedInUser,
            problems,
            user,
            handle, // Pass handle to the template
            topic_name: tags,
            error: null,
            uniqueAcceptedProblems: uniqueAcceptedProblems,
            wrongAnswerProblems: wrongAnswerProblems,
            timeLimitExceededProblems: timeLimitExceededProblems,
            totalSolvedProblems: totalSolvedProblems, // Pass totalSolvedProblems to the template
            visitorCount: req.visitorCount // Pass visitor count from request object to the template
        });

    } catch (error) {
        console.error(error);

        if (error.response && error.response.status === 400) {
            res.render('dashboard', {
                uname: loggedInUser,
                user,
                problems: null,
                handle, // Pass handle to the template
                storedRating: null,
                error: 'Enter your codeforces handle, Ex: tourist, graphs',
                visitorCount: req.visitorCount // Pass visitor count from request object to the template
            });
        } else {
            res.render('dashboard', {
                uname: loggedInUser,
                user,
                problems: null,
                handle, // Pass handle to the template
                storedRating: null,
                error: 'Error fetching problems, API 403 Forbidden Error',
                visitorCount: req.visitorCount // Pass visitor count from request object to the template
            });
        }
    }
});




// Debug Middleware to log req.body
app.use((req, res, next) => {
    console.log('Request Body:', req.body);
    next();
});

app.get('/analyzer', (req, res) => {
    res.render('analyzer', { uname: req.session?.username || null });
});
// Route to display all search records
app.get('/search-records', async (req, res) => {
    try {
        const { data: searchRecords, error: fetchError } = await supabase
            .from('search')
            .select('*') // Select all columns
            .limit(1000); // Set a higher limit or remove it to get all records

        if (fetchError) {
            console.error('Failed to fetch search records:', fetchError.message);
            return res.status(500).send('Failed to fetch search records');
        }

        res.render('search-records', { searchRecords });
    } catch (error) {
        console.error('Error fetching search records:', error);
        res.status(500).send('Error fetching search records');
    }
});

app.post('/analyzer', async (req, res) => {
    try {
        const { codeforcesHandle } = req.body;
        console.log('Received codeforcesHandle:', codeforcesHandle);

        if (!codeforcesHandle) {
            throw new Error('Codeforces handle is required');
        }

        const apiUrl = `https://codeforces.com/api/user.info?handles=${codeforcesHandle}&checkHistoricHandles=false`;
        const apiGraph = `https://codeforces.com/api/user.rating?handle=${codeforcesHandle}`;
        const responseGraph = await axios.get(apiGraph);

        const response = await axios.get(apiUrl);
        const user = response.data.result[0];
        console.log('User:', user);

        // Extracting new ratings from the user's rating history
        const newRatings = responseGraph.data.result.map(entry => entry.newRating);

        // Extracting rating updates
        const ratingUpdates = responseGraph.data.result.map(entry => ({
            updateTime: new Date(entry.ratingUpdateTimeSeconds * 1000).toLocaleString(),
            originalTimeFrame: entry.ratingUpdateTimeSeconds
        }));

        const updatedTime = ratingUpdates.map(update => update.updateTime);
        const originalTimeFramesList = ratingUpdates.map(update => update.originalTimeFrame);

        // List of rating marks
        const ratingMarks = [0, 1200, 1400, 1600, 1900, 2100, 2300, 2400, 2600, 3000];

        res.render('analyzer', {
            user,
            newRatings,
            ratingMarks,
            updatedTime,
            originalTimeFramesList,
            ratingUpdates,
            error: null
        });
    } catch (error) {
        console.log('Error fetching user details:', error);
        res.render('analyzer', {
            user: null,
            newRatings: null,
            ratingMarks: null,
            originalTimeFrame: null,
            ratingUpdates: null,
            error: 'Error fetching user details'
        });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

// Start the server on port 3000
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

// Export the Express app for Vercel serverless functions

module.exports = app;
