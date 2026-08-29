//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:json_annotation/json_annotation.dart';

part 'forum_error_response.g.dart';


@JsonSerializable(
  checked: true,
  createToJson: true,
  disallowUnrecognizedKeys: false,
  explicitToJson: true,
)
class ForumErrorResponse {
  /// Returns a new [ForumErrorResponse] instance.
  ForumErrorResponse({

     this.error,
  });

  @JsonKey(
    
    name: r'error',
    required: false,
    includeIfNull: false,
  )


  final String? error;





    @override
    bool operator ==(Object other) => identical(this, other) || other is ForumErrorResponse &&
      other.error == error;

    @override
    int get hashCode =>
        error.hashCode;

  factory ForumErrorResponse.fromJson(Map<String, dynamic> json) => _$ForumErrorResponseFromJson(json);

  Map<String, dynamic> toJson() => _$ForumErrorResponseToJson(this);

  @override
  String toString() {
    return toJson().toString();
  }

}

