const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'URL'
const supabaseKey = 'ANON_KEY'

const supabase = createClient(supabaseUrl, supabaseKey)

module.exports = { supabase }
