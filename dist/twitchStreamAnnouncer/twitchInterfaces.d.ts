export interface StreamsData {
  /**
   * Array of community IDs.
   */
  community_ids: string[];
  /**
   * ID of the game being played on the stream.
   */
  game_id: string;
  /**
   * Stream ID.
   */
  id: string;
  /**
   * Stream language.
   */
  language: string;
  /**
   * A cursor value, to be used in a subsequent request to specify the starting point of the next set of results.
   */
  pagination: string;
  /**
   * UTC timestamp.
   */
  started_at: string;
  /**
   * Thumbnail URL of the stream. All image URLs have variable width and height. You can replace {width} and {height} with any values to get that size image
   */
  thumbnail_url: string;
  /**
   * Stream title.
   */
  title: string;
  /**
   * Stream type: "live" or "" (in case of error).
   */
  type: string;
  /**
   * ID of the user who is streaming.
   */
  user_id: string;
  /**
   * Login name corresponding to user_id.
   */
  user_name: string;
  /**
   * Number of viewers watching the stream at the time of the query.
   */
  viewer_count: number;
}
export interface StreamsResponseData {
  data: StreamsData[];
}
