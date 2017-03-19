clf();
timings = csvread('timings.txt');
plot(timings(1:120));
title('Acorn/JavaScript performance over time');
xlabel('Execution #');
ylabel('Execution time (ms)');
x=[0.35 0.2];
y=[0.5 0.25];
annotation('textarrow',x,y,'String','Compilation improves performance');