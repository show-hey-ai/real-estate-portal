const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function probe() {
    console.log('Probing column names...');
    // Strategy: Try insert with one field. It will likely fail on 'null constraint' for other fields, 
    // OR fail on 'column not found'.
    // If 'column not found', name is wrong.
    // If 'null value in column ... violates not-null', name is CORRECT.

    const candidates = [
        'propertyType',
        'property_type',
        'propertytype'
    ];

    for (const col of candidates) {
        console.log(`Testing column name: ${col}`);
        const { error } = await supabase
            .from('listings')
            .insert({ [col]: 'Test' });

        if (error) {
            if (error.message.includes('Could not find') || error.message.includes('column') && error.message.includes('does not exist')) {
                console.log(`❌ ${col}: Not found (${error.message})`);
            } else {
                console.log(`✅ ${col}: Found! (Error was: ${error.message})`);
                break;
            }
        } else {
            console.log(`✅ ${col}: Success!`);
            break;
        }
    }

    const candidates2 = [
        'addressBlocked',
        'address_blocked',
        'addressblocked'
    ];

    for (const col of candidates2) {
        console.log(`Testing column name: ${col}`);
        const { error } = await supabase
            .from('listings')
            .insert({ [col]: true });

        if (error) {
            if (error.message.includes('Could not find') || error.message.includes('column') && error.message.includes('does not exist')) {
                console.log(`❌ ${col}: Not found (${error.message})`);
            } else {
                console.log(`✅ ${col}: Found! (Error was: ${error.message})`);
                break;
            }
        } else {
            console.log(`✅ ${col}: Success!`);
            break;
        }
    }
}

probe();
