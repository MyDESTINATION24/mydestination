import { StandardCheckoutClient, Env } from '@phonepe-pg/pg-sdk-node';

const clientId = 'PGTESTPAYUAT'; // Need to check if user has custom env, I'll just load from process.env but in scratch it might not have dotenv
import dotenv from 'dotenv';
dotenv.config({ path: './.env' });

const initPhonePe = () => {
  const cId = process.env.WH_PHONEPE_CLIENT_ID || 'PGTESTPAYUAT';
  const cSecret = process.env.WH_PHONEPE_CLIENT_SECRET || '099eb0cd-02cf-4e2a-8aca-3e6c6aff0399';
  const cVersion = Number(process.env.WH_PHONEPE_CLIENT_VERSION) || 1;
  const envString = process.env.WH_PHONEPE_ENV || 'SANDBOX';
  const env = envString === 'PRODUCTION' ? Env.PRODUCTION : Env.SANDBOX;

  return StandardCheckoutClient.getInstance(cId, cSecret, cVersion, env);
};

async function test() {
  const client = initPhonePe();
  const txnId = 'OM2606121435424809077664';
  try {
    const response = await client.getOrderStatus(txnId, true);
    console.log(JSON.stringify(response, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }
}

test();
