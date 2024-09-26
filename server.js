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

// Initialize Supabase client (if needed in the future)
// const supabaseUrl = 'https://ftqoudjephxownzjfhcs.supabase.co'; // Replace with your Supabase URL
// const supabaseKey = 'your-supabase-service-role-key'; // Replace with your Supabase service role key
// const supabase = createClient(supabaseUrl, supabaseKey);

// Middleware to set a static visitor count
app.use(async (req, res, next) => {
    try {
        // Static visitor count
        const visitorCount = 1020;
        console.log('Visitor count:', visitorCount);
        req.visitorCount = visitorCount; // Store visitor count in request object for use in routes
        next();
    } catch (error) {
        console.error('Error setting visitor count:', error);
        next(error); // Pass error to error handling middleware
    }
});

// Route to render the dashboard
app.get('/', async (req, res) => {
    let user;
    let loggedInUser = null;
    let handle;
    let totalSolvedProblems = 0;

    try {
        if (req.session && req.session.username) {
            loggedInUser = req.session.username;
        }

        handle = req.query.handle || 'Null';
        const userSubmissionUrl = `https://codeforces.com/api/user.status?handle=${handle}&from=1&count=100000`;
        const userSubmissionsResponse = await axios.get(userSubmissionUrl);

        if (userSubmissionsResponse.data.status !== 'OK') {
            throw new Error('Failed to fetch user submissions');
        }

        const acceptedSubmissions = userSubmissionsResponse.data.result.filter(submission => submission.verdict === 'OK');
        const uniqueAcceptedProblems = [...new Set(acceptedSubmissions.map(submission => submission.problem.name))];

        const latestSubmissionsMap = new Map();
        userSubmissionsResponse.data.result.forEach(submission => {
            if (latestSubmissionsMap.has(submission.problem.name)) {
                const currentSubmissionTime = submission.creationTimeSeconds;
                const previousSubmissionTime = latestSubmissionsMap.get(submission.problem.name).creationTimeSeconds;
                if (currentSubmissionTime > previousSubmissionTime) {
                    latestSubmissionsMap.set(submission.problem.name, submission);
                }
            } else {
                latestSubmissionsMap.set(submission.problem.name, submission);
            }
        });

        const wrongAnswerProblems = [];
        const timeLimitExceededProblems = [];
        latestSubmissionsMap.forEach(submission => {
            if (submission.verdict === 'WRONG_ANSWER') {
                wrongAnswerProblems.push(submission.problem.name);
            } else if (submission.verdict === 'TIME_LIMIT_EXCEEDED') {
                timeLimitExceededProblems.push(submission.problem.name);
            }
        });

        totalSolvedProblems = uniqueAcceptedProblems.length;

        const tags = req.query.tags || 'implementation';
        const rating = req.query.rating || '';
        const apiUrl = `https://codeforces.com/api/problemset.problems?tags=${tags}&rating=${rating}`;
        const response = await axios.get(apiUrl);
        const problems = response.data.result.problems;

        const apiUrll = `https://codeforces.com/api/user.info?handles=${handle}&checkHistoricHandles=false`;
        const responsee = await axios.get(apiUrll);
        user = responsee.data.result[0];

        // Removed Supabase data insertion
        // const { data, error } = await supabase.from('search').insert([
        //     { cf_id: handle, topic: tags, time: new Date() }
        // ]);

        // if (error) {
        //     console.error('Failed to insert search record:', error.message);
        //     throw new Error('Failed to insert search record');
        // }

        res.render('dashboard', {
            uname: loggedInUser,
            problems,
            user,
            handle,
            topic_name: tags,
            error: null,
            uniqueAcceptedProblems: uniqueAcceptedProblems,
            wrongAnswerProblems: wrongAnswerProblems,
            timeLimitExceededProblems: timeLimitExceededProblems,
            totalSolvedProblems: totalSolvedProblems
        });

    } catch (error) {
        console.error(error);
        res.render('dashboard', {
            uname: loggedInUser,
            user,
            problems: null,
            handle,
            error: 'Error fetching problems, API 403 Forbidden Error'
        });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something went wrong!');
});

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});
