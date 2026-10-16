import os
s=open('v3.html').read()
head=s[:s.index('</style>')]
# condensed sports display type replaces the bubbly one
head=head.replace('family=Atkinson+Hyperlegible:wght@400;700&family=Bungee&display=swap','family=Atkinson+Hyperlegible:wght@400;700&family=Saira+Condensed:wght@600;800&display=swap')
FONT_OLD='Bungee,"Arial Black",Impact,sans-serif'
head=head.replace(FONT_OLD,'var(--display)')
css_add=open('css_add.css').read().replace(FONT_OLD,'var(--display)')+'\n'+open('style_v7.css').read()+'\n'+open('css_story.css').read()+'\n'+open('css_fx.css').read()+'\n'+open('css_fight.css').read()+'\n'+open('css_shell.css').read()+'\n'+open('css_unified.css').read()+'\n'+open('css_prog2.css').read()+'\n'+open('css_clarity.css').read()+'\n'+open('css_econ.css').read()+'\n'+open('css_anim.css').read()
core=open('core_new.js').read()
art=open('art_build.js').read()+'\n'+open('art_sprite.js').read()
ui=''.join(open(f).read()+'\n' for f in ['ui_a.js','cp_odds.js','cp_soundwheel.js','ui_b.js','ui_scene.js','ui_prog.js','ui_c.js','cp_arenahelp.js','cp_anims.js','ui_d.js','ui_fightfx.js','cp_narr.js','ui_info.js','ui_story.js','ui_cw.js','ui_modes.js','ui_prog2.js','ui_econ.js','ui_armory.js','ui_kit.js','ui_act2.js','ui_goals.js','ui_numbers.js','ui_hubnav.js','ui_icons.js','ui_flavor.js','ui_extras.js','ui_shell.js','ui_e.js'])
out=head+css_add+'\n</style>\n</head>\n'+open('body.html').read()+'<script>\n'+core+'// ===== CORE END =====\n\n'+art+'// ===== CHARACTER ART END =====\n\n'+ui+'</script>\n</body>\n</html>\n'
os.makedirs('../dist',exist_ok=True)
open('../dist/wheel-has-spoken.html','w').write(out)
i=out.index('<script>')+8;j=out.rindex('</script>')
open('page.js','w').write(out[i:j])
print('size',len(out))
