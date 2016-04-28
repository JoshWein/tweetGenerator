package tweetgeneratorprocessinghelper;

import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.io.UnsupportedEncodingException;

/**
 *
 * @author Josh Wein
 */
public class TweetGeneratorProcessingHelper {

    /**
     * @param args the command line arguments
     */
    public static void main(String[] args) throws UnsupportedEncodingException, FileNotFoundException, IOException {
        String encoding = "UTF-8";
        BufferedReader reader;
        BufferedWriter writer;        
        reader = new BufferedReader(new InputStreamReader(new FileInputStream("onemiltweets.txt"), encoding));
        writer = new BufferedWriter(new OutputStreamWriter(new FileOutputStream("onemiltweetsnew.txt"), encoding));
        for (String line; (line = reader.readLine()) != null;) {
            writer.write(line.substring(51, line.length()).split("\t")[1]);
            writer.newLine();
        }
        writer.close();
        reader.close();        
    }    
}
