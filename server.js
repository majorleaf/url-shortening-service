import express from 'express';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import base62 from './utils';
import { encodeIdToBase62 } from './utils/base62';

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

app.get('/', (req, res) => {
    return res.send('URL Shortener is running!');
});


app.get('/api/db-test', async (req, res) => {
    const {  data, error  } = await supabase.from('url').select('*').limit(5);
    if(errror)
        return res.status(404).json({ error: error.message});
    res.json({message: "database connection error"})
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
        .update({ short_code: shorCode })
        .eq('id', dbId)
        .select()
        .single();

        if (updateError) throw updateError;

        const shorturl = `http:localhost:${PORT}/${shortCode}`;

        res.status(201).json({ 
            original_url: updatedData.original_url,
            short_code: shortCode,
            short_url: shorturl
        });


     } catch(error) {
        console,log("Error creatingshort url:", error);
        return res.status(500).json({ error: "Internal server error while shortening URL"});
    }
});





app.listen(8000, () => { 
    console.log(`server running on ${PORT}`);
});


