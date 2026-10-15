/* Sorteios do ambiente independentes das formações e da apresentação. */
class CampaignRandom {
  static version=1;
  constructor(seed=0,saved=null) {
    this.states={clouds:(seed^0x9e3779b9)>>>0,spies:(seed^0x85ebca6b)>>>0,interference:(seed^0xc2b2ae35)>>>0};
    if(saved?.version===CampaignRandom.version)for(const key of Object.keys(this.states))
      if(Number.isInteger(saved.states?.[key]))this.states[key]=saved.states[key]>>>0;
  }
  next(stream) {
    if(!Object.hasOwn(this.states,stream))throw new Error('Sorteio desconhecido: '+stream);
    this.states[stream]=(Math.imul(this.states[stream],1664525)+1013904223)>>>0;
    return this.states[stream]/4294967296;
  }
  snapshot(){return Object.freeze({version:CampaignRandom.version,states:Object.freeze({...this.states})});}
}
if(typeof module!=='undefined'&&module.exports)module.exports={CampaignRandom};
