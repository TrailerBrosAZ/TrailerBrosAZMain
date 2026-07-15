import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const configText=readFileSync(resolve('wrangler.jsonc'),'utf8');const config=JSON.parse(configText) as {workers_dev?:boolean;preview_urls?:boolean;env?:Record<string,{name?:string;workers_dev?:boolean;preview_urls?:boolean;vars?:Record<string,string>}>};
if(/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i.test(configText))throw new Error('Checked-in Worker configuration contains a UUID-shaped identifier.');
if(config.workers_dev!==false||config.preview_urls!==false)throw new Error('Base configuration must not expose workers.dev or preview URLs.');
for(const name of ['staging','production']){const environment=config.env?.[name];if(!environment||environment.workers_dev!==false||environment.preview_urls!==false)throw new Error(`${name} must disable public routes and previews.`);const values=[environment.name,...Object.values(environment.vars||{})];if(values.some(value=>!value||(!/configure/i.test(value)&&!['staging','production','cloudflare-access'].includes(value))))throw new Error(`${name} checked-in configuration must contain placeholders only.`)}
if(!readFileSync(resolve('.gitignore'),'utf8').split(/\r?\n/).includes('wrangler.staging.local.jsonc'))throw new Error('The staging configuration must remain ignored.');
console.log('Environment isolation configuration passed.');
