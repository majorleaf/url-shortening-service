import express from 'express';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { encodeIdToBase62 } from './utils/base62.js';


dotenv.config();


const PORT = process.env.PORT || 8000

const app = express();

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_KEY 


if(!supabaseUrl || !supabaseKey ) {
    console.log('Missing supabase credentials ');
    process.exit(1);
};


const supabase = createClient( supabaseUrl, supabaseKey);


app.use(express.json());

app.use(express.static('public'));

app.use((err, req, res, next) => {
    console.error("Global Error Caught:", err);
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return res.status(400).json({ error: "Invalid JSON format in request body. Please check for missing quotes or commas." });
    }
    // Catch everything else and return it as JSON
    res.status(500).json({ error: "Server Error", details: err.message || "Unexpected crash" });
});


app.get('/', (req, res) => {
    return res.send('URL Shortener is running!');
});


app.get('/api/db-test', async (req, res) => {
    const {  data, error  } = await supabase.from('urls').select('*').limit(5);
    if(error)
        return res.status(500).json({ error: error.message});
    res.json({message: "database connection success", data})
});

// shorten 
app.post('/api/shorten', async (req, res ) => { 
    const { url } = req.body;
    if (!url) {
        return res.status(400).json({ error: 'Please provide a URL to shorten.'});
    }
    try {
        const { data: insertedData, error: insertError } = await supabase
          .from('urls')
          .insert([{ original_url: url }])
          .select()
          .single();

        if (insertError) throw insertError;

        const dbId = insertedData.id;
        const shortCode = encodeIdToBase62(dbId);

        const { data: updatedData, error: updateError } = await supabase
        .from('urls')
        .update({ short_code: shortCode })
        .eq('id', dbId)
        .select()
        .single();

        if (updateError) throw updateError;

        const shorturl = `${req.protocol}://${req.get('host')}/${shortCode}`;

        res.status(201).json({ 
            original_url: updatedData.original_url,
            short_code: shortCode,
            short_url: shorturl
        });


     } catch(error) {
        console.log("Error creatingshort url:", error);
        return res.status(500).json({ error: "Internal server error while shortening URL"});
    }
});



app.get('/:shortCode', async (req, res) => {
    const { shortCode } = req.params;

    try {
        // LOOK UP THE SHORT CODE IN THE DATABASE 
        const { data, error } = await supabase
           .from('urls')
           .select('original_url, clicks')
           .eq('short_code', shortCode)
           .single();
        // if no record found , return error from supabase for .single()
        if ( error || !data) {
            return res.status(404).send('<h1> 404 - URL Not Found</h1><p>This short link does not exist</p>');

        }

        // Increment the click counter!
        // not await because we dont want to delay redirecting the user 
        supabase
              .from('urls' )
             .update({ clicks: data.clicks + 1})
             .eq('short_code', shortCode)
             .then();
        // issue an HTTP 302 redirect to the original URL
        res.redirect(302, data.original_url);


    } catch (error) {
        console.log("error redirecting:", error);
        return res.status(500).json({ error: "Internal server error"});
    }
})

app.listen(PORT, () => { 
    console.log(`server running on ${PORT}`);
});


