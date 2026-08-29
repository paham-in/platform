//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:json_annotation/json_annotation.dart';

part 'tutoring_mark_earnings_taken_request.g.dart';


@JsonSerializable(
  checked: true,
  createToJson: true,
  disallowUnrecognizedKeys: false,
  explicitToJson: true,
)
class TutoringMarkEarningsTakenRequest {
  /// Returns a new [TutoringMarkEarningsTakenRequest] instance.
  TutoringMarkEarningsTakenRequest({

     this.sessionIds,

     this.taken,
  });

      /// sesi yang ditandai
  @JsonKey(
    
    name: r'session_ids',
    required: false,
    includeIfNull: false,
  )


  final List<int>? sessionIds;



      /// true = sudah diambil, false = batalkan
  @JsonKey(
    
    name: r'taken',
    required: false,
    includeIfNull: false,
  )


  final bool? taken;





    @override
    bool operator ==(Object other) => identical(this, other) || other is TutoringMarkEarningsTakenRequest &&
      other.sessionIds == sessionIds &&
      other.taken == taken;

    @override
    int get hashCode =>
        sessionIds.hashCode +
        taken.hashCode;

  factory TutoringMarkEarningsTakenRequest.fromJson(Map<String, dynamic> json) => _$TutoringMarkEarningsTakenRequestFromJson(json);

  Map<String, dynamic> toJson() => _$TutoringMarkEarningsTakenRequestToJson(this);

  @override
  String toString() {
    return toJson().toString();
  }

}

