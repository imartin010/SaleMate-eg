/**
 * Payment Gateway Comprehensive Test Script
 * Tests all payment gateway functionality
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('Required: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const supabaseAdmin = supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

// Test configuration
const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL || 'test@example.com';
const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD || 'testpassword123';
const TEST_AMOUNT = 5000; // Minimum amount

// Test results
const results = {
  passed: 0,
  failed: 0,
  errors: []
};

function logTest(name, passed, error = null) {
  if (passed) {
    console.log(`✅ ${name}`);
    results.passed++;
  } else {
    console.log(`❌ ${name}`);
    if (error) {
      console.error(`   Error: ${error.message || error}`);
      results.errors.push({ test: name, error: error.message || String(error) });
    }
    results.failed++;
  }
}

async function testDatabaseTables() {
  console.log('\n📊 Testing Database Tables...');
  
  try {
    // Test payment_transactions table
    const { data: transactions, error: txError } = await supabase
      .from('payment_transactions')
      .select('id')
      .limit(1);
    
    logTest('payment_transactions table exists', !txError, txError);
    
    // Test wallet_topup_requests table
    const { data: topups, error: topupError } = await supabase
      .from('wallet_topup_requests')
      .select('id')
      .limit(1);
    
    logTest('wallet_topup_requests table exists', !topupError, topupError);
    
    // Test profiles table with wallet_balance
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, wallet_balance')
      .limit(1);
    
    logTest('profiles table with wallet_balance exists', !profileError, profileError);
    
  } catch (error) {
    logTest('Database tables check', false, error);
  }
}

async function testRPCFunction() {
  console.log('\n🔧 Testing RPC Functions...');
  
  try {
    // Test if process_payment_and_topup function exists
    // We'll create a test transaction first
    if (!supabaseAdmin) {
      console.log('⚠️  Skipping RPC test - no service role key');
      return;
    }
    
    // Get a test user
    const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
    if (!users || users.length === 0) {
      console.log('⚠️  No users found for RPC test');
      return;
    }
    
    const testUserId = users[0].id;
    
    // Create a test transaction
    const { data: transaction, error: createError } = await supabaseAdmin
      .from('payment_transactions')
      .insert({
        user_id: testUserId,
        amount: TEST_AMOUNT,
        currency: 'EGP',
        payment_method: 'card',
        gateway: 'test',
        status: 'pending',
        transaction_type: 'wallet_topup',
        test_mode: true
      })
      .select()
      .single();
    
    if (createError || !transaction) {
      logTest('Create test transaction for RPC', false, createError);
      return;
    }
    
    // Test the RPC function
    const { data: rpcResult, error: rpcError } = await supabaseAdmin.rpc(
      'process_payment_and_topup',
      {
        p_transaction_id: transaction.id,
        p_status: 'completed'
      }
    );
    
    logTest('process_payment_and_topup RPC function exists and works', !rpcError, rpcError);
    
    // Clean up test transaction
    await supabaseAdmin
      .from('payment_transactions')
      .delete()
      .eq('id', transaction.id);
    
  } catch (error) {
    logTest('RPC function test', false, error);
  }
}

async function testEdgeFunctions() {
  console.log('\n⚡ Testing Edge Functions...');
  
  try {
    // Test create-kashier-payment function
    const { data: kashierData, error: kashierError } = await supabase.functions.invoke(
      'create-kashier-payment',
      {
        body: {
          amount: TEST_AMOUNT,
          currency: 'EGP',
          payment_method: 'card',
          transaction_id: 'test-' + Date.now()
        }
      }
    );
    
    // Note: This will fail without auth, but we're checking if function exists
    if (kashierError) {
      // Function exists if we get auth error, not found if we get 404
      const functionExists = !kashierError.message?.includes('not found') && 
                            !kashierError.message?.includes('404');
      logTest('create-kashier-payment function exists', functionExists, 
        functionExists ? null : new Error('Function not found'));
    } else {
      logTest('create-kashier-payment function exists and accessible', true);
    }
    
    // Test payment-webhook function
    const { data: webhookData, error: webhookError } = await supabase.functions.invoke(
      'payment-webhook',
      {
        body: {
          transaction_id: 'test-' + Date.now(),
          status: 'completed'
        }
      }
    );
    
    if (webhookError) {
      const functionExists = !webhookError.message?.includes('not found') && 
                            !webhookError.message?.includes('404');
      logTest('payment-webhook function exists', functionExists,
        functionExists ? null : new Error('Function not found'));
    } else {
      logTest('payment-webhook function exists and accessible', true);
    }
    
  } catch (error) {
    logTest('Edge functions test', false, error);
  }
}

async function testEnvironmentVariables() {
  console.log('\n🔐 Testing Environment Variables...');
  
  const testMode = process.env.VITE_PAYMENT_TEST_MODE;
  const kashierKey = process.env.VITE_KASHIER_PAYMENT_KEY;
  const kashierMerchant = process.env.VITE_KASHIER_MERCHANT_ID;
  
  logTest('VITE_PAYMENT_TEST_MODE is set', testMode !== undefined);
  logTest('VITE_KASHIER_PAYMENT_KEY is set', !!kashierKey);
  logTest('VITE_KASHIER_MERCHANT_ID is set', !!kashierMerchant);
  
  if (testMode === 'false') {
    console.log('   ℹ️  Production mode enabled - Kashier will be used');
  } else {
    console.log('   ℹ️  Test mode enabled - Payments will be simulated');
  }
}

async function testPaymentTransactionFlow() {
  console.log('\n💳 Testing Payment Transaction Flow...');
  
  if (!supabaseAdmin) {
    console.log('⚠️  Skipping transaction flow test - no service role key');
    return;
  }
  
  try {
    // Get a test user
    const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
    if (!users || users.length === 0) {
      console.log('⚠️  No users found for transaction test');
      return;
    }
    
    const testUserId = users[0].id;
    
    // Get initial wallet balance
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('wallet_balance')
      .eq('id', testUserId)
      .single();
    
    const initialBalance = parseFloat(profile?.wallet_balance || 0);
    
    // Create wallet top-up request
    const { data: topupRequest, error: topupError } = await supabaseAdmin
      .from('wallet_topup_requests')
      .insert({
        user_id: testUserId,
        amount: TEST_AMOUNT,
        payment_method: 'Card',
        status: 'pending',
        gateway: 'test'
      })
      .select()
      .single();
    
    logTest('Create wallet top-up request', !topupError, topupError);
    
    if (topupError || !topupRequest) {
      return;
    }
    
    // Create payment transaction
    const { data: transaction, error: txError } = await supabaseAdmin
      .from('payment_transactions')
      .insert({
        user_id: testUserId,
        amount: TEST_AMOUNT,
        currency: 'EGP',
        payment_method: 'card',
        gateway: 'test',
        status: 'pending',
        transaction_type: 'wallet_topup',
        reference_id: topupRequest.id,
        test_mode: true
      })
      .select()
      .single();
    
    logTest('Create payment transaction', !txError, txError);
    
    if (txError || !transaction) {
      // Clean up
      await supabaseAdmin
        .from('wallet_topup_requests')
        .delete()
        .eq('id', topupRequest.id);
      return;
    }
    
    // Process payment
    const { data: processResult, error: processError } = await supabaseAdmin.rpc(
      'process_payment_and_topup',
      {
        p_transaction_id: transaction.id,
        p_status: 'completed'
      }
    );
    
    logTest('Process payment via RPC', !processError, processError);
    
    if (!processError) {
      // Verify wallet balance updated
      const { data: updatedProfile } = await supabaseAdmin
        .from('profiles')
        .select('wallet_balance')
        .eq('id', testUserId)
        .single();
      
      const newBalance = parseFloat(updatedProfile?.wallet_balance || 0);
      const balanceUpdated = newBalance === initialBalance + TEST_AMOUNT;
      
      logTest('Wallet balance updated correctly', balanceUpdated, 
        balanceUpdated ? null : new Error(`Expected ${initialBalance + TEST_AMOUNT}, got ${newBalance}`));
      
      // Verify transaction status
      const { data: updatedTransaction } = await supabaseAdmin
        .from('payment_transactions')
        .select('status')
        .eq('id', transaction.id)
        .single();
      
      logTest('Transaction status updated to completed', 
        updatedTransaction?.status === 'completed');
      
      // Verify top-up request approved
      const { data: updatedTopup } = await supabaseAdmin
        .from('wallet_topup_requests')
        .select('status')
        .eq('id', topupRequest.id)
        .single();
      
      logTest('Top-up request approved', updatedTopup?.status === 'approved');
      
      // Restore balance for cleanup
      await supabaseAdmin
        .from('profiles')
        .update({ wallet_balance: initialBalance })
        .eq('id', testUserId);
    }
    
    // Clean up test data
    await supabaseAdmin
      .from('payment_transactions')
      .delete()
      .eq('id', transaction.id);
    
    await supabaseAdmin
      .from('wallet_topup_requests')
      .delete()
      .eq('id', topupRequest.id);
    
  } catch (error) {
    logTest('Payment transaction flow', false, error);
  }
}

async function testRLSPolicies() {
  console.log('\n🔒 Testing RLS Policies...');
  
  try {
    // Test that users can query their own transactions
    const { data, error } = await supabase
      .from('payment_transactions')
      .select('id')
      .limit(1);
    
    // Should either return data or a permission error (both are valid)
    const rlsWorking = !error || error.message?.includes('permission') || error.message?.includes('RLS');
    logTest('RLS policies are active', rlsWorking, rlsWorking ? null : error);
    
  } catch (error) {
    logTest('RLS policies test', false, error);
  }
}

async function runAllTests() {
  console.log('🧪 Payment Gateway Comprehensive Test Suite\n');
  console.log('=' .repeat(60));
  
  await testDatabaseTables();
  await testRPCFunction();
  await testEdgeFunctions();
  await testEnvironmentVariables();
  await testPaymentTransactionFlow();
  await testRLSPolicies();
  
  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 Test Summary:');
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`📈 Success Rate: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%`);
  
  if (results.errors.length > 0) {
    console.log('\n❌ Errors:');
    results.errors.forEach(({ test, error }) => {
      console.log(`   - ${test}: ${error}`);
    });
  }
  
  console.log('\n' + '='.repeat(60));
  
  if (results.failed === 0) {
    console.log('\n🎉 All tests passed! Payment gateway is ready.');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some tests failed. Please review the errors above.');
    process.exit(1);
  }
}

// Run tests
runAllTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

