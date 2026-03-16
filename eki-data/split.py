import pandas as pd
import os

def split_csv(input_file, chunk_size=1000):
    df_iter = pd.read_csv(input_file, chunksize=chunk_size)
    
    base_name = os.path.splitext(input_file)[0]
    
    for i, chunk in enumerate(df_iter):
        output_file = f"{base_name}_part_{i+1}.csv"
        chunk.to_csv(output_file, index=False)

split_csv('S_en.csv')