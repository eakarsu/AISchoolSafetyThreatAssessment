const express=require('express');
const cors=require('cors');
const helmet=require('helmet');
const path=require('path');
require('dotenv').config({path:path.resolve(__dirname,'../.env')});
const auth=require('./middleware/auth');
const {validateRuntime}=require('./governance/runtime');
const {createProviderGate}=require('./governance/providerGate');

validateRuntime();

const app=express();
const PORT=process.env.SERVER_PORT||3001;
const origins=String(process.env.CORS_ORIGINS||process.env.CLIENT_URL||`http://localhost:${process.env.CLIENT_PORT||3000}`).split(',').map((value)=>value.trim()).filter(Boolean);

app.use(helmet());
app.use(cors({origin(origin,callback){if(!origin||origins.includes(origin))return callback(null,true);return callback(new Error('CORS origin denied'));},credentials:true}));
app.use(express.json({limit:'1mb'}));

app.use('/api/auth',require('./routes/auth'));
app.use('/api/tips/form',require('./routes/tipsPublic'));
app.use('/api/tips/submit',require('./routes/tipsPublic'));
app.get('/api/health',(_req,res)=>res.json({status:'ok',timestamp:new Date().toISOString()}));

const legacyDomainPrefixes=[
  '/api/threats','/api/incidents','/api/behavioral','/api/emergency','/api/visitors',
  '/api/audits','/api/training','/api/bullying','/api/mental-health','/api/tips',
  '/api/drills','/api/access-control','/api/alerts','/api/weapons','/api/community','/api/audit-log',
];
app.use(createProviderGate(['/api/ai','/api/gap','/api/ai-center',...legacyDomainPrefixes]));
app.use('/api/governed-safety-responses',require('./governance/router'));
app.use('/api',auth);
app.use('/api',(req,res,next)=>{
  if(!['admin','staff','safety_officer','counselor'].includes(String(req.user.role||''))){
    return res.status(403).json({error:'OPERATIONAL_ROLE_REQUIRED'});
  }
  return next();
});

if(process.env.ENABLE_LEGACY_PROVIDER_ROUTES==='true'){
  for(const [route,moduleName] of [
    ['/api/threats','threats'],['/api/incidents','incidents'],['/api/behavioral','behavioral'],['/api/emergency','emergency'],
    ['/api/visitors','visitors'],['/api/audits','audits'],['/api/training','training'],['/api/bullying','bullying'],
    ['/api/mental-health','mentalHealth'],['/api/tips','tips'],['/api/drills','drills'],['/api/access-control','accessControl'],
    ['/api/alerts','alerts'],['/api/weapons','weapons'],['/api/community','community'],['/api/audit-log','auditLog'],
  ]) app.use(route,require(`./routes/${moduleName}`));
  app.use('/api/ai-center',require('./routes/aiCenter'));
  app.use('/api/ai/threat-severity',require('./routes/ai-threat-severity'));
  app.use('/api/gap-no-threatriskscore-severity-ai',require('./routes/gap-no-threatriskscore-severity-ai'));
  app.use('/api/gap-no-behavioralpatterndetection',require('./routes/gap-no-behavioralpatterndetection'));
  app.use('/api/gap-no-bullyingdetection-from-textcommunication',require('./routes/gap-no-bullyingdetection-from-textcommunication'));
  app.use('/api/gap-no-emergencyreadinessassessment',require('./routes/gap-no-emergencyreadinessassessment'));
  app.use('/api/gap-no-firstresponderbrief-autogeneration',require('./routes/gap-no-firstresponderbrief-autogeneration'));
  app.use('/api/gap-no-mentalhealthreferral-ai-triage',require('./routes/gap-no-mentalhealthreferral-ai-triage'));
  app.use('/api/gap-limited-anonymous-reporting-tips-route-exist',require('./routes/gap-limited-anonymous-reporting-tips-route-exist'));
  app.use('/api/gap-no-sospanic-alert-system-integration',require('./routes/gap-no-sospanic-alert-system-integration'));
  app.use('/api/gap-no-massnotification-smsvoice-emergency-comms',require('./routes/gap-no-massnotification-smsvoice-emergency-comms'));
  app.use('/api/gap-no-firstresponder-integration-cad-push',require('./routes/gap-no-firstresponder-integration-cad-push'));
  app.use('/api/gap-no-sis-student-information-system-integratio',require('./routes/gap-no-sis-student-information-system-integratio'));
  app.use('/api/gap-limited-training-compliance-tracking',require('./routes/gap-limited-training-compliance-tracking'));
}
app.use((err,_req,res,_next)=>{console.error('Server error:',err.message);res.status(err.status||500).json({error:err.status?err.message:'Internal server error'});});
app.use((_req,res)=>res.status(404).json({error:'Route not found'}));
app.listen(PORT,()=>console.log(`School Safety Server running on port ${PORT}`));
module.exports=app;
