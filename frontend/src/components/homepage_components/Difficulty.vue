<template>
  <section class="difficulty" id="difficulty">
    <div class="section-tag">Know Before You Go</div>
    <h2 class="section-title">Which difficulty<br>is right for you?</h2>
    <p class="section-lead">Not sure where to start? Here's an honest breakdown of what each level actually demands — fitness, time, and experience.</p>
    <div class="diff-grid">
      <div v-for="l in levels" :key="l.label" :class="['diff-card', l.cls]">
        <div class="diff-level-bar"></div>
        <div :class="['diff-badge', l.badge]">{{ l.dot }} {{ l.label }}</div>
        <div class="diff-title">{{ l.title }}</div>
        <p class="diff-desc">{{ l.desc }}</p>
        <ul class="diff-specs">
          <li v-for="s in l.specs" :key="s">{{ s }}</li>
        </ul>
        <div class="diff-treks">
          <div class="diff-treks-label">Popular Treks</div>
          <div class="diff-trek-names">{{ l.treks }}</div>
        </div>
      </div>
    </div>
  </section>
</template>

<script>
export default {
  name: 'TsDifficulty',
  name: 'TsDifficulty',
  data() {
    return {
      levels: [
        {
          cls:'diff-easy', badge:'badge-e', dot:'●', label:'Easy',
          title:'First-timer Friendly',
          desc:'Perfect for beginners and families. Well-marked trails, gentle elevation gain, no technical climbing.',
          specs:['3–5 hours of walking per day','Elevation up to 3,500m','No prior trekking experience needed','Duration: 3–5 days typically'],
          treks:'Valley of Flowers · Tungnath · Nag Tibba · Kheerganga'
        },
        {
          cls:'diff-moderate', badge:'badge-m', dot:'●●', label:'Moderate',
          title:'Ready to Push Further',
          desc:'For those comfortable with longer days and higher altitude. Some steep sections and unpredictable weather.',
          specs:['5–7 hours of walking per day','Elevation 3,500m – 4,500m','Prior hiking experience helpful','Duration: 5–8 days typically'],
          treks:'Kedarkantha · Hampta Pass · Brahmatal · Kuari Pass'
        },
        {
          cls:'diff-hard', badge:'badge-h', dot:'●●●', label:'Hard',
          title:'For the Committed',
          desc:'High altitude, long days, technical terrain. These treks will test everything you have.',
          specs:['6–9 hours of walking per day','Elevation above 4,500m','Prior high-altitude experience mandatory','Duration: 7–12 days typically'],
          treks:'Roopkund · Pin Bhaba · Goecha La · Sandakphu'
        }
      ]
    };
  }
};
</script>
