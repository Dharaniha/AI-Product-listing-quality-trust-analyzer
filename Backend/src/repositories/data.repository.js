import { supabase } from '../config/supabase.js';
import bcrypt from 'bcrypt';

// ================= USERS (Supabase) =================

export async function findUserByEmail(email) {
  if (!email) return null;

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email.toLowerCase())
    .single();

  if (error || !data) return null;
  return data;
}

export async function createUser({ name, email, password }) {
  const key = email.toLowerCase();
  const password_hash = password
    ? await bcrypt.hash(password, 10)
    : null;

  const record = {
    name,
    email: key,
    password_hash,
    plan: 'Pro',
    created_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('users')
    .insert([record])
    .select()
    .single();

  if (error) {
    console.error('❌ User insert error:', error);
    throw error;
  }

  return data;
}

export async function findOrCreateUser(email, extraData = {}) {
  if (!email) throw new Error('Email is required');
  const existing = await findUserByEmail(email);
  if (existing) return existing;
  return createUser({
    name: extraData.name || 'User',
    email,
    password: extraData.password || '',
  });
}

// ================= LISTINGS =================

export async function saveListing(userEmail, listing, imageUrls = []) {
  const record = {
    user_id:      userEmail,
    product_name: listing.productName,
    category:     listing.category    || null,
    brand:        listing.brand       || null,
    model:        listing.model       || null,
    condition:    listing.condition   || null,
    age:          listing.age         || null,
    warranty:     listing.warranty    || null,
    description:  listing.description || null,
    image_urls:   imageUrls.length > 0
                    ? imageUrls
                    : Array.isArray(listing.images)
                      ? listing.images.map(img => img.name || img).filter(Boolean)
                      : [],
    created_at:   new Date().toISOString(),
    updated_at:   new Date().toISOString(),
  };

  console.log('LISTING INSERT ATTEMPT:', record);

  const { data, error } = await supabase
    .from('listings')
    .insert([record])
    .select();

  if (error) {
    console.error('❌ Listing insert error:', error);
    throw error;
  }

  return data[0];
}

export async function getListings(userEmail) {
  const { data, error } = await supabase
    .from('listings')
    .select('*')
    .eq('user_id', userEmail)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ Fetch listings error:', error);
    throw error;
  }

  return data;
}

export async function getListingById(userEmail, id) {
  const { data, error } = await supabase
    .from('listings')
    .select('*')
    .eq('id', id)
    .eq('user_id', userEmail)
    .single();

  if (error) {
    console.error('❌ Fetch listing by ID error:', error);
    return null;
  }

  return data;
}

export async function deleteListing(userEmail, id) {
  const { error } = await supabase
    .from('listings')
    .delete()
    .eq('id', id)
    .eq('user_id', userEmail);

  if (error) {
    console.error('❌ Delete listing error:', error);
    return false;
  }

  return true;
}

// ================= ANALYSIS =================

export async function saveAnalysis(userEmail, formData, result) {
  // Guard: block duplicate inserts within 5 seconds
  const { data: recent } = await supabase
    .from('analyses')
    .select('id, created_at')
    .eq('user_id', userEmail)
    .eq('listing_name', result.listingName || formData.productName || 'Untitled')
    .gte('created_at', new Date(Date.now() - 5000).toISOString())
    .limit(1);

  if (recent && recent.length > 0) {
    console.warn('Duplicate analysis insert blocked:', recent[0].id);
    return recent[0];
  }

  const record = {
    user_id:      userEmail,
    listing_name: result.listingName || formData.productName || 'Untitled',
    trust_score:  result.trustScore,
    trust_level:  result.trustLevel,
    created_at:   new Date().toISOString(),
  };

  console.log('INSERT ATTEMPT:', record);

  const { data, error } = await supabase
    .from('analyses')
    .insert([record])
    .select();

  if (error) {
    console.error('❌ Analysis insert error:', error);
    throw error;
  }

  return data[0];
}

export async function getAnalysisHistory(userEmail) {
  const { data, error } = await supabase
    .from('analyses')
    .select('*')
    .eq('user_id', userEmail)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ Fetch analysis error:', error);
    throw error;
  }

  return data;
}

export async function deleteAnalysis(userEmail, id) {
  const { error } = await supabase
    .from('analyses')
    .delete()
    .eq('id', id)
    .eq('user_id', userEmail);

  if (error) {
    console.error('❌ Delete analysis error:', error);
    return false;
  }

  return true;
}

export async function clearAnalysisHistory(userEmail) {
  const { error } = await supabase
    .from('analyses')
    .delete()
    .eq('user_id', userEmail);

  if (error) {
    console.error('❌ Clear analysis error:', error);
    throw error;
  }

  return true;
}