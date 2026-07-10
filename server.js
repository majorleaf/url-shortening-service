import express from 'express';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';


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
})

app.listen(8000, () => { 
    console.log(`server running on ${PORT}`);
});


